import assert from 'node:assert/strict';
import test from 'node:test';

import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';

import footerTelemetry from '../index.ts';
import { FOOTER_TELEMETRY_CHANNEL } from '../src/protocol.ts';

type EventHandler = (event: unknown, ctx: unknown) => void | Promise<void>;

interface Harness {
  pi: ExtensionAPI;
  emitted: Array<{ channel: string; message: unknown }>;
  dispatch(name: string, ctx?: unknown): void;
}

function createHarness(branch: unknown[]): Harness {
  const handlers = new Map<string, EventHandler[]>();
  const emitted: Harness['emitted'] = [];
  const pi = {
    on: (name: string, handler: EventHandler) => {
      const list = handlers.get(name) ?? [];
      list.push(handler);
      handlers.set(name, list);
      return () =>
        handlers.set(
          name,
          (handlers.get(name) ?? []).filter((h) => h !== handler),
        );
    },
    events: {
      emit: (channel: string, message: unknown) => {
        emitted.push({ channel, message });
      },
      on: () => () => undefined,
    },
  } as unknown as ExtensionAPI;
  const context = {
    sessionManager: { getBranch: () => branch },
  } as unknown as ExtensionContext;
  return {
    pi,
    emitted,
    dispatch: (name: string) => {
      for (const handler of handlers.get(name) ?? []) void handler({}, context);
    },
  };
}

test('session start publishes the branch cost snapshot', () => {
  const harness = createHarness([
    {
      type: 'message',
      message: { role: 'assistant', usage: { cost: { total: 0.5 } } },
    },
  ]);
  footerTelemetry(harness.pi);

  harness.dispatch('session_start');

  assert.equal(harness.emitted.length, 1);
  assert.equal(harness.emitted[0]?.channel, FOOTER_TELEMETRY_CHANNEL);
  assert.deepEqual(harness.emitted[0]?.message, {
    protocol: 1,
    type: 'snapshot',
    totalCost: 0.5,
  });
});

test('usage-changing events republish the snapshot', () => {
  const branch: unknown[] = [];
  const harness = createHarness(branch);
  footerTelemetry(harness.pi);

  harness.dispatch('session_start');
  assert.equal(harness.emitted.length, 1);

  branch.push({
    type: 'message',
    message: { role: 'assistant', usage: { cost: { total: 0.25 } } },
  });
  for (const event of ['message_end', 'model_select', 'session_compact']) {
    harness.dispatch(event);
  }
  assert.equal(harness.emitted.length, 4);
  for (const { message } of harness.emitted.slice(1)) {
    assert.deepEqual(message, { protocol: 1, type: 'snapshot', totalCost: 0.25 });
  }
});

test('nothing publishes before session start or after shutdown', () => {
  const harness = createHarness([
    { type: 'message', message: { role: 'assistant', usage: { cost: { total: 9 } } } },
  ]);
  footerTelemetry(harness.pi);

  harness.dispatch('message_end');
  assert.equal(harness.emitted.length, 0);

  harness.dispatch('session_start');
  harness.dispatch('session_shutdown');
  harness.dispatch('message_end');
  assert.equal(harness.emitted.length, 1);
});
