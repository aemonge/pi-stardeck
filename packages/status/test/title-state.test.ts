import assert from 'node:assert/strict';
import test from 'node:test';
import type { OpenSpecState } from '../src/types.ts';
import {
  buildTitleState,
  deriveTitleWork,
  parseTitleState,
  shortenTitleTarget,
  titleStateDebugLine,
} from '../src/title-state.ts';

const openSpec: OpenSpecState = {
  projectRoot: '/project',
  changeId: 'eight-section-deck',
  title: 'Eight-section deck on the title-state contract',
  phase: 'in-progress',
  completedTasks: 1,
  progressPercent: 25,
  totalTasks: 4,
  pendingTasks: [],
  allTasks: [],
  hierarchy: {
    tasks: { completed: 1, total: 4 },
    stepsByTask: { '1': { completed: 4, total: 4 } },
  },
  meta: { source: 'test', refreshedAt: 1, attemptedAt: 1, stale: false },
};

const midWorkActivity = {
  class: 'editing' as const,
  target: 'packages/header/src/deck.ts',
  span: 't87',
  parent: null,
};

test('parser rejects null, arrays, and non-object payloads', () => {
  assert.equal(parseTitleState(null), null);
  assert.equal(parseTitleState(undefined), null);
  assert.equal(parseTitleState('{"v":1}'), null);
  assert.equal(parseTitleState([]), null);
  assert.equal(parseTitleState(7), null);
});

test('parser rejects unknown and missing versions', () => {
  const payload = {
    v: 2,
    subject: 'Rethinking titles',
    work: null,
    activity: null,
    waiver: null,
  };
  assert.equal(parseTitleState(payload), null);
  assert.equal(parseTitleState({ ...payload, v: '1' }), null);
  const { v, ...withoutVersion } = payload;
  assert.equal(v, 2);
  assert.equal(parseTitleState(withoutVersion), null);
});

test('parser accepts the idle shape with every slot null', () => {
  const idle = {
    v: 1,
    subject: 'Pivot cockpit to pure pi-starship-header chrome',
    work: null,
    activity: null,
    waiver: null,
  };
  assert.deepEqual(parseTitleState(idle), idle);
  assert.deepEqual(parseTitleState({ ...idle, subject: null }), {
    ...idle,
    subject: null,
  });
});

test('parser accepts the mid-work shape with work and activity', () => {
  const midWork = {
    v: 1,
    subject: 'Pivot cockpit to pure pi-starship-header chrome',
    work: { change: 'eight-section-deck', done: 1, total: 4 },
    activity: midWorkActivity,
    waiver: null,
  };
  assert.deepEqual(parseTitleState(midWork), midWork);
});

test('parser accepts a waiver with id and notice text', () => {
  const waived = {
    v: 1,
    subject: null,
    work: null,
    activity: null,
    waiver: { id: 'graphify-stale', notice: 'graphify · update recommended' },
  };
  assert.deepEqual(parseTitleState(waived), waived);
});

test('parser rejects malformed work shapes and totals over 999', () => {
  const base = { v: 1, subject: null, activity: null, waiver: null };
  assert.equal(parseTitleState({ ...base, work: { done: 1, total: 4 } }), null);
  assert.equal(
    parseTitleState({ ...base, work: { change: 'deck', done: '1', total: 4 } }),
    null,
  );
  assert.equal(
    parseTitleState({ ...base, work: { change: 'deck', done: 1, total: 1_000 } }),
    null,
  );
  assert.equal(
    parseTitleState({ ...base, work: { change: 'deck', done: 1_000, total: 4 } }),
    null,
  );
  assert.equal(
    parseTitleState({ ...base, work: { change: 'deck', done: -1, total: 4 } }),
    null,
  );
  assert.equal(
    parseTitleState({ ...base, work: { change: 'deck', done: 1.5, total: 4 } }),
    null,
  );
});

test('parser rejects malformed activity shapes and targets over 120 chars', () => {
  const base = { v: 1, subject: null, work: null, waiver: null };
  assert.equal(
    parseTitleState({
      ...base,
      activity: { class: 'editing', target: 'x'.repeat(121), span: 't1', parent: null },
    }),
    null,
  );
  assert.equal(
    parseTitleState({
      ...base,
      activity: { class: 'pairing', target: 'deck.ts', span: 't1', parent: null },
    }),
    null,
  );
  assert.equal(
    parseTitleState({
      ...base,
      activity: { class: 'editing', target: '', span: 't1', parent: null },
    }),
    null,
  );
  assert.equal(
    parseTitleState({
      ...base,
      activity: { class: 'editing', target: 'deck.ts', span: '', parent: null },
    }),
    null,
  );
  assert.equal(
    parseTitleState({
      ...base,
      activity: { class: 'editing', target: 'deck.ts', span: 't1', parent: 42 },
    }),
    null,
  );
  assert.deepEqual(
    parseTitleState({
      ...base,
      activity: {
        class: 'subagent',
        target: 'scout',
        span: 't1:0',
        parent: 't1',
      },
    })?.activity,
    { class: 'subagent', target: 'scout', span: 't1:0', parent: 't1' },
  );
});

test('parser rejects malformed subject and waiver shapes', () => {
  const base = { v: 1, work: null, activity: null, waiver: null };
  assert.equal(parseTitleState({ ...base, subject: 42 }), null);
  assert.equal(parseTitleState({ ...base, subject: ' '.repeat(10) }), null);
  assert.equal(
    parseTitleState({
      ...base,
      subject: 'x'.repeat(181),
    }),
    null,
  );
  const waived = { v: 1, subject: null, work: null, activity: null };
  assert.equal(
    parseTitleState({ ...waived, waiver: { id: '', notice: 'text' } }),
    null,
  );
  assert.equal(parseTitleState({ ...waived, waiver: { id: 'x' } }), null);
  assert.equal(parseTitleState({ ...waived, waiver: 'graphify-stale' }), null);
});

test('builder reads the subject entry and renders idle work as null', () => {
  assert.deepEqual(
    buildTitleState({
      subject: { state: 'set', title: 'Rethinking titles' },
      focus: { mode: 'none' },
    }),
    {
      v: 1,
      subject: 'Rethinking titles',
      work: null,
      activity: null,
      waiver: null,
    },
  );
  assert.deepEqual(
    buildTitleState({
      subject: { state: 'clear' },
      focus: { mode: 'none' },
      activity: midWorkActivity,
    }),
    {
      v: 1,
      subject: null,
      work: null,
      activity: midWorkActivity,
      waiver: null,
    },
  );
});

test('builder derives task-focused work with hierarchy counts', () => {
  assert.deepEqual(
    deriveTitleWork(
      { mode: 'task', change: 'eight-section-deck', taskId: '1.2' },
      openSpec,
    ),
    { change: 'eight-section-deck', task: '1.2', done: 1, total: 4 },
  );
  assert.deepEqual(
    deriveTitleWork(
      { mode: 'task', change: 'eight-section-deck', taskId: '1.2' },
      { ...openSpec, changeId: 'other-change' },
    ),
    { change: 'eight-section-deck', task: '1.2' },
  );
  assert.deepEqual(
    deriveTitleWork(
      { mode: 'task', change: 'eight-section-deck', taskId: '1.2' },
      undefined,
    ),
    { change: 'eight-section-deck', task: '1.2' },
  );
});

test('derives work with schema and the OpenSpec-named rung', () => {
  const rich = {
    ...openSpec,
    schemaName: 'spec',
    ladder: { done: 6, total: 7, rung: 'tasks' },
  };
  assert.deepEqual(
    deriveTitleWork(
      { mode: 'task', change: 'eight-section-deck', taskId: '1.2' },
      rich,
    ),
    {
      change: 'eight-section-deck',
      task: '1.2',
      done: 1,
      total: 4,
      schemaName: 'spec',
      ladder: { done: 6, total: 7, rung: 'tasks' },
    },
  );
  // Human steering 2026-10-23: no invented phase words in any state.
  assert.equal('phase' in (deriveTitleWork({ mode: 'none' }, rich) ?? {}), false);
});

test('builder derives passive work without a task id and clamps totals', () => {
  assert.deepEqual(deriveTitleWork({ mode: 'none' }, openSpec), {
    change: 'eight-section-deck',
    done: 1,
    total: 4,
  });
  assert.deepEqual(
    deriveTitleWork(
      { mode: 'none' },
      {
        ...openSpec,
        completedTasks: 1_200,
        totalTasks: 2_000,
        hierarchy: undefined,
      },
    ),
    { change: 'eight-section-deck', done: 999, total: 999 },
  );
  assert.equal(deriveTitleWork({ mode: 'none' }, null), null);
});

test('shortenTitleTarget bounds live labels to 120 characters', () => {
  assert.equal(shortenTitleTarget('deck.ts'), 'deck.ts');
  assert.equal(
    shortenTitleTarget('  packages/status/src/deck.ts  '),
    'packages/status/src/deck.ts',
  );
  const long = 'a'.repeat(140);
  const shortened = shortenTitleTarget(long);
  assert.equal(Array.from(shortened).length, 120);
  assert.ok(shortened.endsWith('…'));
});

test('builder output round-trips through the defensive parser', () => {
  const built = buildTitleState({
    subject: { state: 'set', title: 'Pivot cockpit to pure pi-starship-header chrome' },
    focus: { mode: 'task', change: 'eight-section-deck', taskId: '1.1' },
    openspec: openSpec,
    activity: {
      class: 'editing',
      target: shortenTitleTarget('packages/header/src/deck.ts'),
      span: 't87',
      parent: null,
    },
  });
  assert.deepEqual(parseTitleState(JSON.parse(JSON.stringify(built))), built);
  const hostile = {
    get v(): number {
      throw new Error('hostile payload');
    },
  };
  assert.equal(parseTitleState(hostile), null);
});

test('debug line prints the compact live title-state JSON', () => {
  const built = buildTitleState({
    subject: { state: 'set', title: 'Pivot cockpit to pure pi-starship-header chrome' },
    focus: { mode: 'task', change: 'eight-section-deck', taskId: '1.1' },
    openspec: openSpec,
    activity: {
      class: 'editing',
      target: 'packages/header/src/deck.ts',
      span: 't87',
      parent: null,
    },
  });
  const line = titleStateDebugLine(built);
  assert.ok(line.startsWith('title-state: {"v":1,'));
  assert.ok(
    line.endsWith(
      '"activity":{"class":"editing","target":"packages/header/src/deck.ts","span":"t87","parent":null},"waiver":null}',
    ),
  );
  assert.deepEqual(
    parseTitleState(JSON.parse(line.slice('title-state: '.length))),
    built,
  );
});
