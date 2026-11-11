import assert from 'node:assert/strict';
import test from 'node:test';
import type { RunSpan } from '../src/types.ts';
import {
  applyEvent,
  derivedStage,
  emptyFacts,
  reduceLedger,
  rootRun,
} from '../src/reducer.ts';

function span(overrides: Partial<RunSpan> = {}): RunSpan {
  return {
    id: 'turn-1',
    kind: 'agent',
    parent: null,
    stage: 'understanding',
    stageDeclared: false,
    since: 1_000,
    ...overrides,
  };
}

test('empty fold yields listening selection-none snapshot with no placeholders', () => {
  const snapshot = reduceLedger([]);
  assert.equal(snapshot.version, 0);
  assert.deepEqual(snapshot.selection, { kind: 'none' });
  assert.equal(snapshot.runs.length, 0);
  assert.equal(snapshot.progress, null);
  assert.equal(derivedStage(snapshot), 'listening');
});

test('applyEvent is pure: input facts are never mutated', () => {
  const facts = emptyFacts();
  applyEvent(facts, { type: 'run/start', at: 1, span: span() });
  assert.equal(facts.runs.size, 0);
});

test('resolver priority: subject is the only selection source', () => {
  const alone = reduceLedger([
    { type: 'focus/subject', at: 1, subject: { state: 'set', title: 'subject' } },
  ]);
  assert.deepEqual(alone.selection, { kind: 'subject', title: 'subject' });
});

test('an empty ledger selects none — no placeholder narration exists', () => {
  const none = reduceLedger([]);
  assert.equal(none.selection.kind, 'none');
  assert.equal(none.runs.length, 0);
});

test('runs fold into a span tree with declaration beating inference', () => {
  const snapshot = reduceLedger([
    { type: 'run/start', at: 1, span: span() },
    {
      type: 'run/start',
      at: 2,
      span: span({
        id: 'sub-1',
        kind: 'subagent',
        parent: 'turn-1',
        agent: 'reviewer',
        stage: 'working',
      }),
    },
    { type: 'run/stage', at: 3, id: 'turn-1', stage: 'working', declared: true },
    { type: 'run/stage', at: 4, id: 'turn-1', stage: 'assuring', declared: false },
  ]);
  assert.equal(snapshot.runs.length, 2);
  assert.equal(rootRun(snapshot)?.id, 'turn-1');
  assert.equal(rootRun(snapshot)?.stage, 'working');
  assert.equal(derivedStage(snapshot), 'working');
  const reviewer = snapshot.runs.find((run) => run.id === 'sub-1');
  assert.equal(reviewer?.agent, 'reviewer');
  assert.equal(reviewer?.stage, 'working');
});

test('inference may set stage before any declaration arrives', () => {
  const snapshot = reduceLedger([
    { type: 'run/start', at: 1, span: span() },
    { type: 'run/stage', at: 2, id: 'turn-1', stage: 'assuring', declared: false },
  ]);
  assert.equal(snapshot.runs[0]?.stage, 'assuring');
  assert.equal(snapshot.runs[0]?.stageDeclared, false);
});

test('ended spans stay recorded but stop accepting stage updates', () => {
  const snapshot = reduceLedger([
    { type: 'run/start', at: 1, span: span() },
    { type: 'run/end', at: 2, id: 'turn-1' },
    { type: 'run/stage', at: 3, id: 'turn-1', stage: 'answering', declared: true },
  ]);
  assert.equal(snapshot.runs[0]?.endedAt, 2);
  assert.equal(snapshot.runs[0]?.stage, 'understanding');
});

test('stage and end events for unknown ids are no-ops', () => {
  const before = reduceLedger([{ type: 'run/start', at: 1, span: span() }]);
  const after = reduceLedger([
    { type: 'run/start', at: 1, span: span() },
    { type: 'run/stage', at: 2, id: 'ghost', stage: 'working', declared: true },
    { type: 'run/end', at: 3, id: 'ghost' },
  ]);
  assert.deepEqual(after.selection, before.selection);
  assert.deepEqual(after.runs, before.runs);
  assert.deepEqual(after.progress, before.progress);
  assert.equal(after.version, 3);
});

test('progress refresh carries freshness and version counts events', () => {
  const snapshot = reduceLedger([
    {
      type: 'progress/refresh',
      at: 42,
      progress: {
        tasks: { completed: 2, total: 5 },
        steps: { completed: 6, total: 14 },
        freshAt: 42,
      },
    },
  ]);
  assert.deepEqual(snapshot.progress?.tasks, { completed: 2, total: 5 });
  assert.equal(snapshot.version, 1);
});
