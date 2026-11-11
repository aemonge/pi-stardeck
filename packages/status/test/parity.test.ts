import assert from 'node:assert/strict';
import test from 'node:test';
import { headerSelection } from '../src/publisher.ts';
import {
  reduceLedger,
  resolveSelection,
  snapshotFromFacts,
  emptyFacts,
} from '../src/reducer.ts';
import { applyEvent } from '../src/reducer.ts';
import type { LedgerEvent } from '../src/ledger.ts';
import type { RunSpan } from '../src/types.ts';

const subject = { state: 'set' as const, title: 'Session subject' };

function span(overrides: Partial<RunSpan> = {}): RunSpan {
  return {
    id: 'turn-1',
    kind: 'agent',
    parent: null,
    stage: 'working',
    stageDeclared: false,
    since: 1,
    ...overrides,
  };
}

test('resolver slot matches the legacy headerSelection waterfall (T2 parity)', () => {
  const cases: Array<{
    name: string;
    facts: Parameters<typeof resolveSelection>[0];
    legacy: Parameters<typeof headerSelection>[0];
    expected: string;
  }> = [
    {
      name: 'nothing set',
      facts: {
        subject: { state: 'clear' },
      },
      legacy: {},
      expected: 'none',
    },
    {
      name: 'subject alone',
      facts: {
        subject,
      },
      legacy: { subject },
      expected: 'subject',
    },
  ];

  for (const testCase of cases) {
    const resolved = resolveSelection(testCase.facts).kind;
    const legacySelection = headerSelection(testCase.legacy);
    const legacyKind = legacySelection
      ? legacySelection.source === 'openspec'
        ? 'openspec-task'
        : legacySelection.source
      : 'none';
    assert.equal(resolved, testCase.expected, testCase.name);
    assert.equal(legacyKind, testCase.expected, `${testCase.name} (legacy)`);
  }
});

test('incremental recordEvent fold equals a full ledger replay (T2 parity)', () => {
  const events: LedgerEvent[] = [
    { type: 'focus/subject', at: 1, subject },
    { type: 'run/start', at: 3, span: span() },
    {
      type: 'run/start',
      at: 4,
      span: span({ id: 'sub-1', kind: 'subagent', parent: 'turn-1', agent: 'scout' }),
    },
    { type: 'run/stage', at: 5, id: 'turn-1', stage: 'assuring', declared: true },
    {
      type: 'progress/refresh',
      at: 6,
      progress: {
        tasks: { completed: 1, total: 2 },
        steps: { completed: 3, total: 7 },
        freshAt: 6,
      },
    },
    { type: 'run/end', at: 7, id: 'sub-1' },
  ];

  let incremental = emptyFacts();
  for (const event of events) {
    incremental = applyEvent(incremental, event);
  }
  const incrementalSnapshot = snapshotFromFacts(incremental, events.length);
  const replaySnapshot = reduceLedger(events);

  assert.deepEqual(incrementalSnapshot.selection, replaySnapshot.selection);
  assert.deepEqual(incrementalSnapshot.runs, replaySnapshot.runs);
  assert.deepEqual(incrementalSnapshot.progress, replaySnapshot.progress);
  assert.equal(incrementalSnapshot.selection.kind, 'subject');
  assert.equal(incrementalSnapshot.runs.length, 2);
});

test('exhibit regression: no selection narrates nothing (exhibits 1 and 5)', async () => {
  const { buildHeaderStatusEvent } = await import('../src/publisher.ts');
  for (const fallbackTitles of [undefined, ['no focus'], ['no OpenSpec']]) {
    const event = buildHeaderStatusEvent([], {
      openSpec: null,
      subject: { state: 'clear' },
      orchestration: null,
      lifecycle: 'understanding',
      activity: { kind: 'understanding' },
      taskflowPhase: undefined,
      ...(fallbackTitles ? { fallbackTitles } : {}),
    });
    assert.deepEqual(event.work?.titles ?? [], []);
    const serialized = JSON.stringify(event);
    for (const token of [
      'no focus',
      'no OpenSpec',
      'OpenSpec clear',
      'OpenSpec unavailable',
    ]) {
      assert.equal(serialized.includes(token), false, token);
    }
  }
});
