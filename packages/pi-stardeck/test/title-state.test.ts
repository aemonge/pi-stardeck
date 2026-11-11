import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DECK_TITLE_ACTIVITY_CLASSES,
  type DeckTitleState,
  type DeckTitleWorkState,
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

test('parses the aimed work state with the room aim verbatim fields', () => {
  const work = {
    change: 'observe-room-aim',
    artifactName: '4-execute',
    artifactIdx: '4/4',
    task: '4/12',
    nextStep: 'eospec approve',
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

test('retired work fields normalize away instead of rejecting', () => {
  // A producer carrying retired work fields still parses — the retired
  // keys drop out and the change name survives.
  assert.deepEqual(
    parseDeckTitleState({
      v: 2,
      subject: null,
      work: {
        change: 'x',
        schemaName: 'spec',
        currentArtifact: 'a',
        artifacts: [{ id: 'a', done: true }],
      },
      activity: null,
      waiver: null,
    })?.work,
    { change: 'x' },
  );
  assert.deepEqual(
    parseDeckTitleState({
      v: 2,
      subject: null,
      work: { change: 'x', awaitingValidation: true, focusAt: 1, focusStale: true },
      activity: null,
      waiver: null,
    })?.work,
    { change: 'x' },
  );
});

test('rejects malformed aim-field shapes', () => {
  const base = { v: 2, subject: null, activity: null, waiver: null };
  const cases = [
    { change: 'deck', artifactName: 7 },
    { change: 'deck', artifactIdx: 4 },
    { change: 'deck', nextStep: 'x'.repeat(181) },
    { change: 'deck', artifactName: 'x'.repeat(121) },
  ];
  // Null on an optional field is absent, not malformed.
  assert.deepEqual(
    parseDeckTitleState({ ...base, work: { change: 'deck', task: null } })?.work,
    { change: 'deck' },
  );
  for (const work of cases) {
    assert.equal(parseDeckTitleState({ ...base, work }), null, JSON.stringify(work));
  }
  // Valid shapes pass.
  const parsed = parseDeckTitleState({
    ...base,
    work: {
      change: 'deck',
      artifactName: 'a',
      artifactIdx: '1/1',
      task: '1/2',
      nextStep: 'go',
    },
  });
  assert.equal(parsed?.work?.artifactName, 'a');
  assert.equal(parsed?.work?.nextStep, 'go');
});

test('enforces the schema bounds: targets and label lengths', () => {
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
      work: { change: 'observe-room-aim', artifactName: long(121) },
    }),
    null,
    'artifact name beyond 120 characters rejects',
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
  assert.equal(
    parseDeckTitleState({
      ...titleState(),
      work: { change: 'observe-room-aim', nextStep: long(180) },
    })?.work?.nextStep,
    long(180),
    'next-step at the bound parses',
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

test('the room aim prints verbatim — the render law, one row per case', () => {
  const full: DeckTitleWorkState = {
    change: 'truthful-rendered-state',
    artifactName: '4-execute',
    artifactIdx: '4/4',
    task: '4/12',
    nextStep: 'eospec approve',
  };
  const texts = (work: DeckTitleWorkState, compact = false) =>
    deckWorkSegments(work, compact).map((segment) => segment.text);
  const colors = (work: DeckTitleWorkState) =>
    deckWorkSegments(work).map(
      (segment) => `${segment.color}:${segment.text}${segment.bold ? '!' : ''}`,
    );
  // Full row: read as-is, printed as-is — no prefixes, no relabeling.
  assert.deepEqual(texts(full), [
    '4-execute 4/4',
    ' › ',
    '4/12',
    ' ⟩ ',
    'eospec approve',
  ]);
  assert.deepEqual(colors(full), [
    'accent:4-execute 4/4',
    'accent: › ',
    'accent:4/12',
    'accent: ⟩ ',
    'dim:eospec approve',
  ]);
  // Missing artifact_name drops the group; artifact_idx drops with it.
  assert.deepEqual(texts({ ...full, artifactName: undefined }), [
    ' › ',
    '4/12',
    ' ⟩ ',
    'eospec approve',
  ]);
  // Missing artifact_idx: the name prints alone — counts never 0/N.
  assert.deepEqual(texts({ ...full, artifactIdx: undefined }), [
    '4-execute',
    ' › ',
    '4/12',
    ' ⟩ ',
    'eospec approve',
  ]);
  // Missing task: the minor separator dies with the segment.
  assert.deepEqual(texts({ ...full, task: undefined }), [
    '4-execute 4/4',
    ' ⟩ ',
    'eospec approve',
  ]);
  // Missing next-step: the trailing major separator dies.
  assert.deepEqual(texts({ ...full, nextStep: undefined }), [
    '4-execute 4/4',
    ' › ',
    '4/12',
  ]);
  // Only change: today's bare aim, verbatim.
  assert.deepEqual(texts({ change: 'truthful-rendered-state' }), []);
  // Compact yields the dim commentary first — identity and progress stay.
  assert.deepEqual(texts(full, true), ['4-execute 4/4', ' › ', '4/12']);
  // The plain-text label joins the aimed segments.
  assert.equal(formatDeckWorkLabel(full), '4-execute 4/4 › 4/12 ⟩ eospec approve');
  // Overlong next-step text rejects the whole work object on parse.
  assert.equal(
    parseDeckTitleState({
      v: 2,
      subject: null,
      work: { change: 'deck', nextStep: 'x'.repeat(181) },
      activity: null,
      waiver: null,
    }),
    null,
  );
  // The aimed fields survive the wire contract.
  assert.deepEqual(
    parseDeckTitleState({
      v: 2,
      subject: null,
      work: full,
      activity: null,
      waiver: null,
    })?.work,
    full,
  );
});
