import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  expandAuthReference,
  normalizeZaiEnvelope,
  readZaiKey,
  startZaiQuotaProvider,
} from '../src/quota-zai.ts';
import { activeQuotaProviders } from '../src/quota.ts';

const NOW = 1_760_000_000; // fixed unix seconds for label math
const H = 3600;

test('expandAuthReference passes literals through', () => {
  assert.equal(expandAuthReference('sk-literal'), 'sk-literal');
});

test('expandAuthReference resolves ${ENV} references', () => {
  process.env.ZAI_TEST_KEY = 'sk-from-env';
  try {
    assert.equal(expandAuthReference('${ZAI_TEST_KEY}'), 'sk-from-env');
  } finally {
    delete process.env.ZAI_TEST_KEY;
  }
});

test('expandAuthReference fails soft on missing env', () => {
  assert.equal(expandAuthReference('${ZAI_DEFINITELY_MISSING_42}'), undefined);
});

test('readZaiKey reads zai.key from the pi auth file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'zai-auth-'));
  const authPath = join(dir, 'auth.json');
  try {
    await writeFile(authPath, JSON.stringify({ zai: { key: 'sk-literal' } }));
    assert.equal(await readZaiKey(authPath), 'sk-literal');
    await writeFile(authPath, JSON.stringify({ other: true }));
    assert.equal(await readZaiKey(authPath), undefined);
    await writeFile(authPath, '{not json');
    assert.equal(await readZaiKey(authPath), undefined);
    assert.equal(await readZaiKey(join(dir, 'absent.json')), undefined);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('normalizeZaiEnvelope converts millisecond reset times (live envelope shape)', () => {
  // The real z.ai envelope (verified with a live key 2026-10-19) reports
  // nextResetTime in ms — seconds-styled fixtures keep working too.
  const envelope = {
    data: {
      limits: [
        {
          type: 'CREDIT_LIMIT',
          unit: 3,
          number: 5,
          percentage: 35,
          nextResetTime: (NOW + 3 * H) * 1000,
        },
        {
          type: 'CREDIT_LIMIT',
          unit: 6,
          number: 1,
          percentage: 7,
          nextResetTime: (NOW + 6 * 24 * H) * 1000,
        },
      ],
    },
  };
  assert.deepEqual(normalizeZaiEnvelope(envelope, NOW), [
    { label: '5h', percent: 35, resetAt: NOW + 3 * H },
    { label: '7d', percent: 7, resetAt: NOW + 6 * 24 * H },
  ]);
});

test('normalizeZaiEnvelope skips TIME limits and normalizes both usage forms', () => {
  const envelope = {
    data: {
      limits: [
        {
          type: 'TIME2880',
          usage: 100,
          currentValue: 50,
          nextResetTime: NOW + 200 * H,
        },
        { type: 'TOKEN_5H', percentage: 82, nextResetTime: NOW + 3 * H },
        {
          type: 'CREDIT_WEEK',
          usage: 1000,
          currentValue: 120,
          nextResetTime: NOW + 6 * 24 * H,
        },
      ],
    },
  };
  assert.deepEqual(normalizeZaiEnvelope(envelope, NOW), [
    { label: '5h', percent: 82, resetAt: NOW + 3 * H },
    { label: '7d', percent: 12, resetAt: NOW + 6 * 24 * H },
  ]);
});

test('normalizeZaiEnvelope sorts by reset deadline and labels by distance', () => {
  const envelope = {
    data: {
      limits: [
        { type: 'WEEK', percentage: 30, nextResetTime: NOW + 10 * 24 * H },
        { type: 'CODING', percentage: 60, nextResetTime: NOW + 2 * H },
        { type: 'MONTHLY', percentage: 5, nextResetTime: NOW + 40 * 24 * H },
      ],
    },
  };
  const windows = normalizeZaiEnvelope(envelope, NOW);
  assert.deepEqual(
    windows?.map(({ label }) => label),
    ['5h', '7d', '40d'],
  );
  assert.deepEqual(
    windows?.map(({ percent }) => percent),
    [60, 30, 5],
  );
});

test('normalizeZaiEnvelope clamps percentages into 0-100', () => {
  const envelope = {
    data: {
      limits: [
        { type: 'A', percentage: 130, nextResetTime: NOW + H },
        { type: 'B', usage: 10, currentValue: -5, nextResetTime: NOW + 2 * H },
      ],
    },
  };
  assert.deepEqual(
    normalizeZaiEnvelope(envelope, NOW)?.map(({ percent }) => percent),
    [100, 0],
  );
});

test('normalizeZaiEnvelope fails soft on unusable envelopes', () => {
  assert.equal(normalizeZaiEnvelope({}, NOW), undefined);
  assert.equal(normalizeZaiEnvelope({ data: {} }, NOW), undefined);
  assert.equal(normalizeZaiEnvelope({ data: { limits: [] } }, NOW), undefined);
  assert.equal(
    normalizeZaiEnvelope(
      { data: { limits: [{ type: 'TIME30', percentage: 1 }] } },
      NOW,
    ),
    undefined,
  );
  assert.equal(
    normalizeZaiEnvelope(
      { data: { limits: [{ type: 'X', percentage: 5 }] } }, // no reset time
      NOW,
    ),
    undefined,
  );
});

function jsonResponse(envelope: unknown, status = 200): Response {
  return new Response(JSON.stringify(envelope), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('startZaiQuotaProvider fetches, caches, and keeps cache on transient failure', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'zai-live-'));
  const authPath = join(dir, 'auth.json');
  const modes: string[] = [];
  let status = 200;
  let envelope: unknown = {
    data: {
      limits: [
        { type: 'TOKEN_5H', percentage: 82, nextResetTime: NOW + 3 * H },
        { type: 'CREDIT_WEEK', percentage: 12, nextResetTime: NOW + 6 * 24 * H },
      ],
    },
  };
  // Auth file first: the provider's initial fire-and-forget refresh must
  // find the key, not report a missing one.
  await writeFile(authPath, JSON.stringify({ zai: { key: 'sk-live' } }));
  const handle = startZaiQuotaProvider({
    authPath,
    now: () => NOW,
    debug: (message) => modes.push(message),
    fetchImpl: async () => jsonResponse(envelope, status),
  });
  try {
    await handle.refresh();
    const provider = activeQuotaProviders().find(({ id }) => id === 'zai');
    assert.deepEqual(provider?.snapshot(), {
      percent: 82,
      windows: [
        { label: '5h', percent: 82, resetAt: NOW + 3 * H },
        { label: '7d', percent: 12, resetAt: NOW + 6 * 24 * H },
      ],
    });

    // Transient failure: cache survives, one debug line per distinct mode.
    status = 503;
    envelope = undefined;
    await handle.refresh();
    assert.equal(provider?.snapshot()?.percent, 82, 'cache keeps the lit gauge');
    assert.deepEqual(modes, ['zai quota: http 503']);

    // Success re-arms distinct-mode reporting.
    status = 200;
    envelope = { data: { limits: [] } };
    await handle.refresh();
    assert.equal(provider?.snapshot()?.percent, 82, 'unusable envelope keeps cache');
    assert.deepEqual(modes, ['zai quota: http 503', 'zai quota: no usable windows']);
    handle.stop();
  } finally {
    handle.stop();
    await rm(dir, { recursive: true, force: true });
  }
});

test('startZaiQuotaProvider stays dark without a key and never fetches', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'zai-nokey-'));
  const authPath = join(dir, 'auth.json'); // never written
  let fetches = 0;
  const handle = startZaiQuotaProvider({
    authPath,
    now: () => NOW,
    fetchImpl: async () => {
      fetches += 1;
      return jsonResponse({});
    },
  });
  try {
    await handle.refresh();
    assert.equal(fetches, 0);
    const provider = activeQuotaProviders().find(({ id }) => id === 'zai');
    assert.equal(provider?.snapshot(), undefined);
  } finally {
    handle.stop();
    await rm(dir, { recursive: true, force: true });
  }
});
