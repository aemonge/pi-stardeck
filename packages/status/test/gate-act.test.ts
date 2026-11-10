import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { after } from 'node:test';
import { resolveGateAct } from '../src/gate-act.ts';
import type { CommandRunner } from '../src/types.ts';

const ACT_LINE = 'awaiting draft of 3-plan.md (artifact plan)';
const COMMIT_LINE = 'read 3-plan.md → grant: pios-gate commit relay-gate-act-line';

const roots: string[] = [];

after(() => {
  return Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function changeProject(change: string, withMeta = true): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), `gate-act-${process.pid}-`));
  roots.push(root);
  const changeRoot = join(root, 'openspec', 'changes', change);
  await mkdir(changeRoot, { recursive: true });
  if (withMeta) {
    await writeFile(
      join(changeRoot, '.openspec.yaml'),
      'schema: spec\nstatus: proposed\n',
    );
  }
  return root;
}

type Probe = {
  calls: number;
  last?: { command: string; args: string[]; cwd: string; timeoutMs: number };
};

function recordingRunner(
  probe: Probe,
  responses?: Array<{ stdout?: string; code?: number; killed?: boolean }>,
  failure?: Error,
): CommandRunner {
  return async (command, args, options) => {
    probe.calls += 1;
    probe.last = { command, args, cwd: options.cwd, timeoutMs: options.timeoutMs };
    if (failure) throw failure;
    const response = responses?.[probe.calls - 1] ?? responses?.at(-1) ?? {};
    return {
      stdout: response.stdout ?? '',
      stderr: '',
      code: response.code ?? 0,
      killed: response.killed,
    };
  };
}

test('the gate act first line is relayed verbatim through the runner', async () => {
  const change = 'relay-gate-act-line';
  const root = await changeProject(change);
  const probe: Probe = { calls: 0 };
  const runner = recordingRunner(probe, [
    { stdout: `${ACT_LINE}\nlater lines are ignored\n` },
  ]);

  assert.equal(await resolveGateAct({ change, projectRoot: root, runner }), ACT_LINE);
  assert.deepEqual(probe.last, {
    command: 'pios-gate',
    args: ['act', change],
    cwd: root,
    timeoutMs: 2_000,
  });
});

test('any non-zero exit — including the unknown-change 2 — renders no gate line', async () => {
  const exitTwo = await changeProject('exit-two');
  const exitOne = await changeProject('exit-one');
  const probe: Probe = { calls: 0 };

  assert.equal(
    await resolveGateAct({
      change: 'exit-two',
      projectRoot: exitTwo,
      runner: recordingRunner(probe, [{ code: 2 }]),
    }),
    undefined,
  );
  assert.equal(
    await resolveGateAct({
      change: 'exit-one',
      projectRoot: exitOne,
      runner: recordingRunner(probe, [{ code: 1 }]),
    }),
    undefined,
  );
});

test('a timeout kill renders no gate line', async () => {
  const change = 'killed-change';
  const root = await changeProject(change);
  const probe: Probe = { calls: 0 };
  const runner = recordingRunner(probe, [{ stdout: ACT_LINE, killed: true }]);

  assert.equal(await resolveGateAct({ change, projectRoot: root, runner }), undefined);
});

test('empty stdout renders no gate line', async () => {
  const change = 'quiet-change';
  const root = await changeProject(change);
  const probe: Probe = { calls: 0 };
  const runner = recordingRunner(probe, [{ stdout: '\n   \n' }]);

  assert.equal(await resolveGateAct({ change, projectRoot: root, runner }), undefined);
});

test('a spawn failure renders no gate line and is cached quietly', async () => {
  const change = 'absent-bin-change';
  const root = await changeProject(change);
  const probe: Probe = { calls: 0 };
  const runner = recordingRunner(probe, [], new Error('spawn pios-gate ENOENT'));

  assert.equal(await resolveGateAct({ change, projectRoot: root, runner }), undefined);
  assert.equal(await resolveGateAct({ change, projectRoot: root, runner }), undefined);
  assert.equal(probe.calls, 1);
});

test('an unchanged meta mtime skips the second probe', async () => {
  const change = 'stable-change';
  const root = await changeProject(change);
  const probe: Probe = { calls: 0 };
  const runner = recordingRunner(probe, [{ stdout: ACT_LINE }]);

  assert.equal(await resolveGateAct({ change, projectRoot: root, runner }), ACT_LINE);
  assert.equal(await resolveGateAct({ change, projectRoot: root, runner }), ACT_LINE);
  assert.equal(probe.calls, 1);
});

test('a changed meta mtime re-probes and takes the new truth', async () => {
  const change = 'moving-change';
  const root = await changeProject(change);
  const metaPath = join(root, 'openspec', 'changes', change, '.openspec.yaml');
  const probe: Probe = { calls: 0 };
  const runner = recordingRunner(probe, [
    { stdout: ACT_LINE },
    { stdout: COMMIT_LINE },
  ]);

  assert.equal(await resolveGateAct({ change, projectRoot: root, runner }), ACT_LINE);
  const later = new Date(Date.now() + 5_000);
  await utimes(metaPath, later, later);
  assert.equal(
    await resolveGateAct({ change, projectRoot: root, runner }),
    COMMIT_LINE,
  );
  assert.equal(probe.calls, 2);
});

test('a vanished meta re-probes honestly', async () => {
  const change = 'vanishing-change';
  const root = await changeProject(change);
  const metaPath = join(root, 'openspec', 'changes', change, '.openspec.yaml');
  const probe: Probe = { calls: 0 };
  const runner = recordingRunner(probe, [
    { stdout: ACT_LINE },
    { stdout: COMMIT_LINE },
  ]);

  assert.equal(await resolveGateAct({ change, projectRoot: root, runner }), ACT_LINE);
  await rm(metaPath);
  assert.equal(
    await resolveGateAct({ change, projectRoot: root, runner }),
    COMMIT_LINE,
  );
  assert.equal(probe.calls, 2);
});

test('a stat-less change re-probes only after the bounded TTL', async () => {
  const change = 'no-meta-change';
  const root = await changeProject(change, false);
  const probe: Probe = { calls: 0 };
  const runner = recordingRunner(probe, [{ stdout: ACT_LINE }]);

  assert.equal(
    await resolveGateAct({ change, projectRoot: root, runner, now: 1_000 }),
    ACT_LINE,
  );
  assert.equal(
    await resolveGateAct({ change, projectRoot: root, runner, now: 2_000 }),
    ACT_LINE,
  );
  assert.equal(probe.calls, 1);
  assert.equal(
    await resolveGateAct({
      change,
      projectRoot: root,
      runner,
      now: 32_000,
    }),
    ACT_LINE,
  );
  assert.equal(probe.calls, 2);
});

test('a traversal or absolute slug never spawns and renders nothing', async () => {
  const root = await changeProject('inside-change');
  const probe: Probe = { calls: 0 };
  const runner = recordingRunner(probe, [{ stdout: ACT_LINE }]);

  assert.equal(
    await resolveGateAct({ change: '../outside', projectRoot: root, runner }),
    undefined,
  );
  assert.equal(
    await resolveGateAct({ change: '/etc/passwd', projectRoot: root, runner }),
    undefined,
  );
  assert.equal(probe.calls, 0);
});
