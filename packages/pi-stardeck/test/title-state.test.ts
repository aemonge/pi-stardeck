import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DECK_TITLE_ACTIVITY_CLASSES,
  type DeckTitleState,
  formatDeckWorkLabel,
  parseDeckTitleState,
  parseDeckTurnCost,
} from '../src/title-state.ts';

function titleState(overrides: Partial<DeckTitleState> = {}): DeckTitleState {
  return {
    v: 1,
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
      v: 1,
      subject: 'Pivot cockpit to pure pi-starship-header chrome',
      work: null,
      activity: null,
      waiver: null,
    }),
    titleState(),
  );
});

test('parses the mid-work title state with work, activity, and nesting', () => {
  assert.deepEqual(
    parseDeckTitleState({
      v: 1,
      subject: 'Pivot cockpit to pure pi-starship-header chrome',
      work: { change: 'eight-section-deck', task: '2.1', done: 1, total: 4 },
      activity: {
        class: 'editing',
        target: 'packages/pi-stardeck/src/deck.ts',
        span: 't87',
        parent: null,
      },
      waiver: null,
    }),
    titleState({
      work: { change: 'eight-section-deck', task: '2.1', done: 1, total: 4 },
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
      v: 1,
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
    { v: 2, subject: null, work: null, activity: null, waiver: null },
    { v: '1', subject: null, work: null, activity: null, waiver: null },
    { v: 1, subject: 7, work: null, activity: null, waiver: null },
    { v: 1, subject: null, work: 'nope', activity: null, waiver: null },
    {
      v: 1,
      subject: null,
      work: { change: 'x', done: 1 },
      activity: null,
      waiver: null,
    },
    { v: 1, subject: null, work: null, activity: { class: 'dancing' }, waiver: null },
    { v: 1, subject: null, work: null, activity: null, waiver: { id: 'only-id' } },
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

test('enforces the schema bounds: targets, totals, and label lengths', () => {
  const long = (length: number) => 'x'.repeat(length);
  assert.equal(
    parseDeckTitleState({
      ...titleState(),
      activity: { class: 'bash', target: long(49), span: 't1', parent: null },
    }),
    null,
    'target beyond 48 characters rejects',
  );
  assert.equal(
    parseDeckTitleState({
      ...titleState(),
      work: { change: 'eight-section-deck', done: 1, total: 1_000 },
    }),
    null,
    'total beyond 999 rejects',
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

test('formats the Work label as change · done/total', () => {
  assert.equal(
    formatDeckWorkLabel({ change: 'eight-section-deck', done: 1, total: 4 }),
    'eight-section-deck · 1/4',
  );
  assert.equal(
    formatDeckWorkLabel({
      change: 'eight-section-deck',
      task: '2.1',
      done: 4,
      total: 4,
    }),
    'eight-section-deck · 4/4',
  );
});
