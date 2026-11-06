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
  artifacts: [
    { id: 'brainstorm', done: true },
    { id: 'plan', done: false, items: { done: 1, total: 4 } },
  ],
  currentArtifact: 'plan',
  changeModifiedAt: 5_000,
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
  assert.equal(parseTitleState('{"v":2}'), null);
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
  // v1 predates the artifact/attention contract; unknown versions reject.
  assert.equal(parseTitleState({ ...payload, v: 1 }), null);
  assert.equal(parseTitleState({ ...payload, v: 3 }), null);
  assert.equal(parseTitleState({ ...payload, v: '2' }), null);
  const { v, ...withoutVersion } = payload;
  assert.equal(v, 2);
  assert.equal(parseTitleState(withoutVersion), null);
});

test('parser accepts the idle shape with every slot null', () => {
  const idle = {
    v: 2 as const,
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

test('parser accepts the mid-work shape with artifacts and attention facts', () => {
  const midWork = {
    v: 2 as const,
    subject: 'Pivot cockpit to pure pi-starship-header chrome',
    work: {
      change: 'eight-section-deck',
      task: '1.2',
      schemaName: 'spec',
      artifacts: [
        { id: 'brainstorm', done: true },
        { id: 'plan', done: false, items: { done: 1, total: 4 } },
      ],
      currentArtifact: 'plan',
      awaitingValidation: true,
      focusAt: 1_000,
      focusStale: true,
    },
    activity: midWorkActivity,
    waiver: null,
  };
  assert.deepEqual(parseTitleState(midWork), midWork);
  // False flags normalize to absent — the canonical shape carries truthy
  // facts only, and explicit-false payloads still parse instead of rejecting.
  const normalized = parseTitleState({
    ...midWork,
    work: { ...midWork.work, focusStale: false },
  })?.work as Record<string, unknown>;
  assert.equal('focusStale' in normalized, false);
});

test('parser accepts a waiver with id and notice text', () => {
  const waived = {
    v: 2 as const,
    subject: null,
    work: null,
    activity: null,
    waiver: { id: 'graphify-stale', notice: 'graphify · update recommended' },
  };
  assert.deepEqual(parseTitleState(waived), waived);
});

test('parser rejects malformed artifact shapes and item counts', () => {
  const base = { v: 2, subject: null, activity: null, waiver: null };
  // Non-array, oversized arrays, and non-object entries all reject.
  assert.equal(
    parseTitleState({ ...base, work: { change: 'deck', artifacts: 4 } }),
    null,
  );
  assert.equal(
    parseTitleState({
      ...base,
      work: {
        change: 'deck',
        artifacts: Array.from({ length: 17 }, () => ({ id: 'a', done: true })),
      },
    }),
    null,
  );
  assert.equal(
    parseTitleState({ ...base, work: { change: 'deck', artifacts: [{ id: 'a' }] } }),
    null,
  );
  assert.equal(
    parseTitleState({
      ...base,
      work: { change: 'deck', artifacts: [{ id: 'a', done: 'yes' }] },
    }),
    null,
  );
  assert.equal(
    parseTitleState({
      ...base,
      work: { change: 'deck', artifacts: [{ id: 7, done: true }] },
    }),
    null,
  );
  // Item counts must be a bounded integer pair when present.
  assert.equal(
    parseTitleState({
      ...base,
      work: {
        change: 'deck',
        artifacts: [{ id: 'a', done: true, items: { done: 1 } }],
      },
    }),
    null,
  );
  assert.equal(
    parseTitleState({
      ...base,
      work: {
        change: 'deck',
        artifacts: [{ id: 'a', done: true, items: { done: 1_000, total: 4 } }],
      },
    }),
    null,
  );
  assert.equal(
    parseTitleState({
      ...base,
      work: {
        change: 'deck',
        artifacts: [{ id: 'a', done: true, items: { done: -1, total: 4 } }],
      },
    }),
    null,
  );
  assert.equal(
    parseTitleState({
      ...base,
      work: { change: 'deck', artifacts: [{ id: 'a', done: true, items: 4 }] },
    }),
    null,
  );
  assert.deepEqual(
    parseTitleState({
      ...base,
      work: {
        change: 'deck',
        artifacts: [{ id: 'a', done: true, items: { done: 4, total: 4 } }],
      },
    })?.work,
    {
      change: 'deck',
      artifacts: [{ id: 'a', done: true, items: { done: 4, total: 4 } }],
    },
  );
});

test('parser rejects malformed attention facts', () => {
  const base = { v: 2, subject: null, activity: null, waiver: null };
  assert.equal(
    parseTitleState({ ...base, work: { change: 'deck', awaitingValidation: 'yes' } }),
    null,
  );
  assert.equal(
    parseTitleState({ ...base, work: { change: 'deck', focusAt: -1 } }),
    null,
  );
  assert.equal(
    parseTitleState({ ...base, work: { change: 'deck', focusAt: 1.5 } }),
    null,
  );
  assert.equal(
    parseTitleState({
      ...base,
      work: { change: 'deck', focusAt: Number.MAX_SAFE_INTEGER + 1 },
    }),
    null,
  );
  assert.equal(
    parseTitleState({ ...base, work: { change: 'deck', focusStale: 1 } }),
    null,
  );
  // Truthy booleans and a safe-integer timestamp pass through.
  assert.deepEqual(
    parseTitleState({
      ...base,
      work: {
        change: 'deck',
        task: '1',
        awaitingValidation: true,
        focusAt: 4_000,
        focusStale: true,
      },
    })?.work,
    {
      change: 'deck',
      task: '1',
      awaitingValidation: true,
      focusAt: 4_000,
      focusStale: true,
    },
  );
});

test('parser rejects malformed activity shapes and targets over 120 chars', () => {
  const base = { v: 2, subject: null, work: null, waiver: null };
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
  const base = { v: 2, work: null, activity: null, waiver: null };
  assert.equal(parseTitleState({ ...base, subject: 42 }), null);
  assert.equal(parseTitleState({ ...base, subject: ' '.repeat(10) }), null);
  assert.equal(
    parseTitleState({
      ...base,
      subject: 'x'.repeat(181),
    }),
    null,
  );
  const waived = { v: 2, subject: null, work: null, activity: null };
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
      v: 2,
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
      v: 2,
      subject: null,
      work: null,
      activity: midWorkActivity,
      waiver: null,
    },
  );
});

test('builder derives task-focused work from artifact facts, never counts', () => {
  assert.deepEqual(
    deriveTitleWork(
      {
        mode: 'task',
        change: 'eight-section-deck',
        taskId: '1.2',
        awaitingValidation: false,
      },
      openSpec,
    ),
    {
      change: 'eight-section-deck',
      task: '1.2',
      artifacts: openSpec.artifacts,
      currentArtifact: 'plan',
    },
  );
  // Counts (CLI or hierarchy opinion) never reach the contract — change
  // totals live only on artifact items, and only from files.
  assert.equal(
    'done' in
      (deriveTitleWork(
        {
          mode: 'task' as const,
          change: 'eight-section-deck',
          taskId: '1.2',
          awaitingValidation: false,
        },
        openSpec,
      ) ?? {}),
    false,
  );
  assert.equal(
    'total' in
      (deriveTitleWork(
        {
          mode: 'task' as const,
          change: 'eight-section-deck',
          taskId: '1.2',
          awaitingValidation: false,
        },
        openSpec,
      ) ?? {}),
    false,
  );
  assert.deepEqual(
    deriveTitleWork(
      {
        mode: 'task',
        change: 'eight-section-deck',
        taskId: '1.2',
        awaitingValidation: false,
      },
      { ...openSpec, changeId: 'other-change' },
    ),
    { change: 'eight-section-deck', task: '1.2' },
  );
  assert.deepEqual(
    deriveTitleWork(
      {
        mode: 'task',
        change: 'eight-section-deck',
        taskId: '1.2',
        awaitingValidation: false,
      },
      undefined,
    ),
    { change: 'eight-section-deck', task: '1.2' },
  );
});

test('derives attention facts from focus truth, never authors them', () => {
  const focus = {
    mode: 'task' as const,
    change: 'eight-section-deck',
    taskId: '1.2',
    awaitingValidation: true,
  };
  // Awaiting validation rides the focus fact straight through.
  assert.deepEqual(deriveTitleWork(focus, openSpec), {
    change: 'eight-section-deck',
    task: '1.2',
    artifacts: openSpec.artifacts,
    currentArtifact: 'plan',
    awaitingValidation: true,
  });
  // Stale: the change's files moved after the focus fact was recorded.
  assert.deepEqual(deriveTitleWork(focus, openSpec, { focusAt: 1_000 }), {
    change: 'eight-section-deck',
    task: '1.2',
    artifacts: openSpec.artifacts,
    currentArtifact: 'plan',
    awaitingValidation: true,
    focusAt: 1_000,
    focusStale: true,
  });
  // Fresh: the focus fact postdates every file mtime.
  assert.deepEqual(deriveTitleWork(focus, openSpec, { focusAt: 6_000 }), {
    change: 'eight-section-deck',
    task: '1.2',
    artifacts: openSpec.artifacts,
    currentArtifact: 'plan',
    awaitingValidation: true,
    focusAt: 6_000,
  });
  // Without a focus timestamp there is no staleness opinion at all.
  const quiet = deriveTitleWork(focus, openSpec);
  assert.equal('focusAt' in (quiet ?? {}), false);
  assert.equal('focusStale' in (quiet ?? {}), false);
  // Passive work never carries attention facts.
  const passive = deriveTitleWork({ mode: 'none' }, openSpec, { focusAt: 1 });
  assert.deepEqual(passive, {
    change: 'eight-section-deck',
    artifacts: openSpec.artifacts,
    currentArtifact: 'plan',
  });
});

test('derives work with schema and artifact facts without inventing data', () => {
  const rich = {
    ...openSpec,
    schemaName: 'spec',
    artifacts: [{ id: 'brainstorm', done: true }],
    currentArtifact: 'brainstorm',
  };
  assert.deepEqual(
    deriveTitleWork(
      {
        mode: 'task',
        change: 'eight-section-deck',
        taskId: '1.2',
        awaitingValidation: false,
      },
      rich,
    ),
    {
      change: 'eight-section-deck',
      task: '1.2',
      schemaName: 'spec',
      artifacts: [{ id: 'brainstorm', done: true }],
      currentArtifact: 'brainstorm',
    },
  );
  // No invented phase words in any state (Human steering 2026-10-23).
  assert.equal('phase' in (deriveTitleWork({ mode: 'none' }, rich) ?? {}), false);
});

test('builder derives passive work without a task id — counts never clamp in', () => {
  assert.deepEqual(deriveTitleWork({ mode: 'none' }, openSpec), {
    change: 'eight-section-deck',
    artifacts: openSpec.artifacts,
    currentArtifact: 'plan',
  });
  // Absent artifact facts leave only the change name; no fabricated totals.
  assert.deepEqual(
    deriveTitleWork(
      { mode: 'none' },
      { ...openSpec, artifacts: undefined, currentArtifact: undefined },
    ),
    { change: 'eight-section-deck' },
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
    focus: {
      mode: 'task',
      change: 'eight-section-deck',
      taskId: '1.1',
      awaitingValidation: false,
    },
    openspec: openSpec,
    activity: {
      class: 'editing',
      target: shortenTitleTarget('packages/header/src/deck.ts'),
      span: 't87',
      parent: null,
    },
    focusAt: 1_000,
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
    focus: {
      mode: 'task',
      change: 'eight-section-deck',
      taskId: '1.1',
      awaitingValidation: false,
    },
    openspec: openSpec,
    activity: {
      class: 'editing',
      target: 'packages/header/src/deck.ts',
      span: 't87',
      parent: null,
    },
  });
  const line = titleStateDebugLine(built);
  assert.ok(line.startsWith('title-state: {"v":2,'));
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
