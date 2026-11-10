import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DECK_TITLE_ACTIVITY_CLASSES,
  type DeckTitleState,
  deckWorkSegments,
  formatDeckWorkLabel,
  parseDeckTitleState,
  parseDeckTurnCost,
} from '../src/title-state.ts';

function titleState(overrides: Partial<DeckTitleState> = {}): DeckTitleState {
  return {
    v: 2,
    subject: 'Pivot cockpit to pure pi-starship-header chrome',
    work: null,
    activity: null,
    waiver: null,
    ...overrides,
  };
}

/** 2026-11-06T12:00:00Z — the fixed render-time clock for age assertions. */
const NOW = 1_765_113_600_000;

test('parses the idle title state verbatim', () => {
  assert.deepEqual(
    parseDeckTitleState({
      v: 2,
      subject: 'Pivot cockpit to pure pi-starship-header chrome',
      work: null,
      activity: null,
      waiver: null,
    }),
    titleState(),
  );
});

test('parses the mid-work title state with artifacts and attention facts', () => {
  const work = {
    change: 'eight-section-deck',
    task: '2.1',
    schemaName: 'spec',
    artifacts: [
      { id: 'brainstorm', done: true, items: { done: 3, total: 3 } },
      { id: 'plan', done: false, items: { done: 1, total: 4 } },
    ],
    currentArtifact: 'plan',
  };
  assert.deepEqual(
    parseDeckTitleState({
      v: 2,
      subject: 'Pivot cockpit to pure pi-starship-header chrome',
      work,
      activity: {
        class: 'editing',
        target: 'packages/pi-stardeck/src/deck.ts',
        span: 't87',
        parent: null,
      },
      waiver: null,
    }),
    titleState({
      work,
      activity: {
        class: 'editing',
        target: 'packages/pi-stardeck/src/deck.ts',
        span: 't87',
        parent: null,
      },
    }),
  );
  assert.deepEqual(
    parseDeckTitleState({
      v: 2,
      subject: null,
      work: null,
      activity: {
        class: 'subagent',
        target: 'scout',
        span: 'sub-1',
        parent: 't87',
      },
      waiver: null,
    }),
    titleState({
      subject: null,
      activity: { class: 'subagent', target: 'scout', span: 'sub-1', parent: 't87' },
    }),
  );
});

test('rejects unknown versions and malformed shapes with null, never throws', () => {
  for (const malformed of [
    null,
    undefined,
    'not-an-object',
    42,
    [],
    { v: 1, subject: null, work: null, activity: null, waiver: null },
    { v: 3, subject: null, work: null, activity: null, waiver: null },
    { v: '2', subject: null, work: null, activity: null, waiver: null },
    { v: 2, subject: 7, work: null, activity: null, waiver: null },
    { v: 2, subject: null, work: 'nope', activity: null, waiver: null },
    { v: 2, subject: null, work: null, activity: { class: 'dancing' }, waiver: null },
    { v: 2, subject: null, work: null, activity: null, waiver: { id: 'only-id' } },
  ]) {
    assert.equal(parseDeckTitleState(malformed), null, JSON.stringify(malformed));
  }
  const hostile = {
    get subject() {
      throw new Error('hostile payload');
    },
  };
  assert.doesNotThrow(() => {
    assert.equal(parseDeckTitleState(hostile), null);
  });
});

test('retired v1 work keys normalize away instead of rejecting', () => {
  // A v1 producer mislabeling itself v2 still parses — the retired keys
  // (done/total/ladder) drop out and the change name survives.
  assert.deepEqual(
    parseDeckTitleState({
      v: 2,
      subject: null,
      work: { change: 'x', done: 1, total: 4 },
      activity: null,
      waiver: null,
    })?.work,
    { change: 'x' },
  );
  assert.deepEqual(
    parseDeckTitleState({
      v: 2,
      subject: null,
      work: { change: 'x', ladder: { done: 1, total: 2, rung: 'tasks' } },
      activity: null,
      waiver: null,
    })?.work,
    { change: 'x' },
  );
});

test('rejects malformed artifact and attention shapes', () => {
  const base = { v: 2, subject: null, activity: null, waiver: null };
  const cases = [
    { change: 'deck', artifacts: 'nope' },
    {
      change: 'deck',
      artifacts: Array.from({ length: 17 }, () => ({ id: 'a', done: true })),
    },
    { change: 'deck', artifacts: [{ id: 'a' }] },
    { change: 'deck', artifacts: [{ id: 'a', done: 'yes' }] },
    { change: 'deck', artifacts: [{ id: 'a', done: true, items: { done: 1 } }] },
    {
      change: 'deck',
      artifacts: [{ id: 'a', done: true, items: { done: 1_000, total: 4 } }],
    },
    { change: 'deck', currentArtifact: '' },
    { change: 'deck', awaitingValidation: 'yes' },
    { change: 'deck', focusAt: -5 },
    { change: 'deck', focusAt: 1.5 },
    { change: 'deck', focusStale: 'no' },
  ];
  for (const work of cases) {
    assert.equal(parseDeckTitleState({ ...base, work }), null, JSON.stringify(work));
  }
  // Valid shapes pass: bounded items, safe-integer focusAt, truthy flags.
  const parsed = parseDeckTitleState({
    ...base,
    work: {
      change: 'deck',
      artifacts: [{ id: 'a', done: true, items: { done: 999, total: 999 } }],
      currentArtifact: 'a',
      awaitingValidation: true,
      focusAt: 4_102_444_800_000,
      focusStale: true,
    },
  });
  assert.equal(parsed?.work?.currentArtifact, 'a');
  assert.equal(parsed?.work?.focusStale, true);
});

test('enforces the schema bounds: targets, items, and label lengths', () => {
  const long = (length: number) => 'x'.repeat(length);
  assert.equal(
    parseDeckTitleState({
      ...titleState(),
      activity: { class: 'bash', target: long(121), span: 't1', parent: null },
    }),
    null,
    'target beyond 120 characters rejects',
  );
  assert.equal(
    parseDeckTitleState({
      ...titleState(),
      work: {
        change: 'eight-section-deck',
        artifacts: [{ id: 'a', done: false, items: { done: 1, total: 1_000 } }],
      },
    }),
    null,
    'item total beyond 999 rejects',
  );
  assert.equal(
    parseDeckTitleState({ ...titleState(), subject: long(181) }),
    null,
    'subject beyond 180 characters rejects',
  );
  assert.equal(
    parseDeckTitleState({ ...titleState(), subject: long(180) })?.subject,
    long(180),
  );
  assert.equal(
    parseDeckTitleState({
      ...titleState(),
      activity: { class: 'reading', target: long(48), span: 't1', parent: null },
    })?.activity?.target,
    long(48),
    'target at the bound parses',
  );
});

test('accepts exactly the five observed activity classes', () => {
  for (const class_ of DECK_TITLE_ACTIVITY_CLASSES) {
    const parsed = parseDeckTitleState({
      ...titleState(),
      activity: { class: class_, target: 'schema.yaml', span: 't1', parent: null },
    });
    assert.equal(parsed?.activity?.class, class_);
  }
  assert.equal(
    parseDeckTitleState({
      ...titleState(),
      activity: { class: 'compiling', target: 'x', span: 't1', parent: null },
    }),
    null,
  );
});

test('parses turn cost snapshots and rejects malformed meters', () => {
  assert.deepEqual(parseDeckTurnCost({ tokens: 4_200, elapsedMs: 38_000 }), {
    tokens: 4_200,
    elapsedMs: 38_000,
  });
  assert.deepEqual(parseDeckTurnCost({ tokens: 0, elapsedMs: 0 }), {
    tokens: 0,
    elapsedMs: 0,
  });
  for (const malformed of [
    null,
    undefined,
    'x',
    {},
    { tokens: -1, elapsedMs: 0 },
    { tokens: 0, elapsedMs: -5 },
    { tokens: Number.NaN, elapsedMs: 0 },
    { tokens: 0, elapsedMs: Number.POSITIVE_INFINITY },
    { tokens: '4200', elapsedMs: 0 },
    { tokens: 1, elapsedMs: 100 * 60_000 },
  ]) {
    assert.equal(parseDeckTurnCost(malformed), null, JSON.stringify(malformed));
  }
  const hostile = {
    get tokens() {
      throw new Error('hostile payload');
    },
  };
  assert.doesNotThrow(() => {
    assert.equal(parseDeckTurnCost(hostile), null);
  });
});

test('focused, working — current artifact, artifact progress, then items', () => {
  const segments = deckWorkSegments(
    {
      change: 'polish-upload-validations',
      task: '8-1',
      artifacts: [
        { id: 'brainstorm', done: true },
        { id: 'investigate', done: true },
        { id: 'plan', done: true },
        { id: 'execute', done: true, items: { done: 12, total: 15 } },
      ],
      currentArtifact: 'execute',
    },
    NOW,
  );
  assert.deepEqual(
    segments.map(
      (segment) => `${segment.color}:${segment.text}${segment.bold ? '!' : ''}`,
    ),
    [
      'success:polish-upload-validations!',
      'accent: › ',
      'accent:execute 4/4',
      'accent: › ',
      'accent:󰄱 12/15',
    ],
  );
  assert.equal(
    segments.map((segment) => segment.text).join(''),
    'polish-upload-validations › execute 4/4 › 󰄱 12/15',
  );
});

test('awaiting validation replaces the whole tile', () => {
  const segments = deckWorkSegments(
    {
      change: 'polish-upload-validations',
      task: '8-1',
      awaitingValidation: true,
      artifacts: [{ id: 'execute', done: true, items: { done: 12, total: 15 } }],
      currentArtifact: 'execute',
    },
    NOW,
  );
  assert.deepEqual(segments, [{ text: '⏸ awaiting you', color: 'warning' }]);
});

test('no items — honest absence, no zero', () => {
  assert.deepEqual(
    deckWorkSegments(
      {
        change: 'polish-upload-validations',
        artifacts: [
          { id: 'brainstorm', done: true },
          { id: 'investigate', done: true },
          { id: 'plan', done: true },
          { id: 'execute', done: true },
        ],
        currentArtifact: 'execute',
      },
      NOW,
    ),
    [
      { text: 'polish-upload-validations', color: 'success', bold: true },
      { text: ' › ', color: 'accent' },
      { text: 'execute 4/4', color: 'success' },
    ],
  );
  // Zero checkboxes parse to absence upstream; even a literal 0/0 item pair
  // would never be emitted by the collector — but the renderer still hides
  // an empty-total pair defensively, keeping only the artifact group.
  assert.deepEqual(
    deckWorkSegments(
      {
        change: 'deck',
        artifacts: [{ id: 'a', done: false, items: { done: 0, total: 0 } }],
        currentArtifact: 'a',
      },
      NOW,
    ),
    [
      { text: 'deck', color: 'success', bold: true },
      { text: ' › ', color: 'accent' },
      { text: 'a 0/1', color: 'accent' },
    ],
  );
});

test('stale focus replaces the artifact group; items survive', () => {
  const segments = deckWorkSegments(
    {
      change: 'polish-upload-validations',
      task: '8-1',
      focusAt: NOW - 3 * 60 * 60 * 1_000,
      focusStale: true,
      artifacts: [{ id: 'execute', done: true, items: { done: 12, total: 15 } }],
      currentArtifact: 'execute',
    },
    NOW,
  );
  assert.deepEqual(
    segments.map(
      (segment) => `${segment.color}:${segment.text}${segment.bold ? '!' : ''}`,
    ),
    [
      'success:polish-upload-validations!',
      'accent: › ',
      'dim:⚠ focus 3h old',
      'accent: › ',
      'accent:󰄱 12/15',
    ],
  );
  // Stale with no items keeps the slug and the attention segment.
  assert.deepEqual(
    deckWorkSegments({ change: 'deck', focusAt: NOW - 42_000, focusStale: true }, NOW),
    [
      { text: 'deck', color: 'success', bold: true },
      { text: ' › ', color: 'accent' },
      { text: '⚠ focus 42s old', color: 'dim' },
    ],
  );
});

test('artifact progress turns success at completion; items tick bold and green', () => {
  const segments = deckWorkSegments(
    {
      change: 'deck',
      artifacts: [
        { id: 'plan', done: true, items: { done: 4, total: 4 } },
        { id: 'execute', done: true },
      ],
      currentArtifact: 'plan',
    },
    NOW,
  );
  assert.deepEqual(
    segments.map(
      (segment) => `${segment.color}:${segment.text}${segment.bold ? '!' : ''}`,
    ),
    ['success:deck!', 'accent: › ', 'success:plan 2/2', 'accent: › ', 'success:✔ 4/4!'],
  );
  // Mixed state: artifacts done but items still open — one hue, accent.
  const working = deckWorkSegments(
    {
      change: 'deck',
      artifacts: [
        { id: 'plan', done: true },
        { id: 'execute', done: true, items: { done: 12, total: 15 } },
      ],
      currentArtifact: 'execute',
    },
    NOW,
  );
  assert.deepEqual(
    working.map(
      (segment) => `${segment.color}:${segment.text}${segment.bold ? '!' : ''}`,
    ),
    [
      'success:deck!',
      'accent: › ',
      'accent:execute 2/2',
      'accent: › ',
      'accent:󰄱 12/15',
    ],
  );
});

test('the slug always leads — openspec identity never yields', () => {
  assert.deepEqual(deckWorkSegments({ change: 'eight-section-deck' }, NOW), [
    { text: 'eight-section-deck', color: 'success', bold: true },
  ]);
  // Artifact progress is a real fact — 0/1 artifacts done renders; only
  // absent item counts stay hidden.
  assert.deepEqual(
    deckWorkSegments(
      { change: 'deck', artifacts: [{ id: 'a', done: false }], currentArtifact: 'a' },
      NOW,
    ),
    [
      { text: 'deck', color: 'success', bold: true },
      { text: ' › ', color: 'accent' },
      { text: 'a 0/1', color: 'accent' },
    ],
  );
});

test('compact width: attention and progress yield first, items survive longest', () => {
  const work = {
    change: 'polish-upload-validations',
    artifacts: [
      { id: 'plan', done: true },
      { id: 'execute', done: false, items: { done: 12, total: 15 } },
    ],
    currentArtifact: 'execute',
  };
  assert.deepEqual(
    deckWorkSegments(work, NOW, true).map((segment) => segment.text),
    ['polish-upload-validations', ' › ', '󰄱 12/15'],
  );
  // Awaiting you yields entirely in compact mode.
  assert.deepEqual(
    deckWorkSegments({ change: 'deck', awaitingValidation: true }, NOW, true),
    [],
  );
  // Stale focus yields too; the items remain.
  assert.deepEqual(
    deckWorkSegments(
      { ...work, focusAt: NOW - 60_000, focusStale: true },
      NOW,
      true,
    ).map((segment) => segment.text),
    ['polish-upload-validations', ' › ', '󰄱 12/15'],
  );
});

test('the plain-text label joins the segments', () => {
  assert.equal(
    formatDeckWorkLabel({
      change: 'polish-upload-validations',
      artifacts: [{ id: 'execute', done: true, items: { done: 12, total: 15 } }],
      currentArtifact: 'execute',
    }),
    'polish-upload-validations › execute 1/1 › 󰄱 12/15',
  );
});

test('the gate act sits dim in the optional slot; compact yields it first', () => {
  const work = {
    change: 'truthful-rendered-state',
    artifacts: [
      { id: 'brainstorm', done: true },
      { id: 'investigate', done: true },
      { id: 'plan', done: true },
      { id: 'execute', done: false, items: { done: 2, total: 5 } },
    ],
    currentArtifact: 'execute',
    gateAct: 'awaiting draft of 4-execute.md (artifact execute)',
  };
  assert.deepEqual(
    deckWorkSegments(work, NOW).map(
      (segment) => `${segment.color}:${segment.text}${segment.bold ? '!' : ''}`,
    ),
    [
      'success:truthful-rendered-state!',
      'accent: › ',
      'accent:execute 3/4',
      'accent: › ',
      'dim:gate: awaiting draft of 4-execute.md (artifact execute)',
      'accent: › ',
      'accent:󰄱 2/5',
    ],
  );
  // Compact yields the commentary first — identity and truth survive.
  assert.equal(
    deckWorkSegments(work, NOW, true)
      .map((segment) => segment.text)
      .join(''),
    'truthful-rendered-state › 󰄱 2/5',
  );
  // Overlong gate text rejects the whole work object on parse.
  assert.equal(
    parseDeckTitleState({
      v: 2,
      subject: null,
      work: { change: 'deck', gateAct: 'x'.repeat(181) },
      activity: null,
      waiver: null,
    }),
    null,
  );
});
