import assert from 'node:assert/strict';
import test from 'node:test';
import {
  aimTitleWork,
  buildTitleState,
  parseTitleState,
  shortenTitleTarget,
  titleStateDebugLine,
} from '../src/title-state.ts';

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

test('parser accepts the aimed shape with the room aim verbatim fields', () => {
  const aimed = {
    v: 2 as const,
    subject: 'Pivot cockpit to pure pi-starship-header chrome',
    work: {
      change: 'observe-room-aim',
      artifactName: '4-execute',
      artifactIdx: '4/4',
      task: '4/12',
      nextStep: 'eospec approve',
    },
    activity: midWorkActivity,
    waiver: null,
  };
  assert.deepEqual(parseTitleState(aimed), aimed);
  // A bare slug aim parses — absence over invention, never zeros.
  assert.deepEqual(
    parseTitleState({ ...aimed, work: { change: 'observe-room-aim' } })?.work,
    { change: 'observe-room-aim' },
  );
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

test('parser ignores retired work fields and rejects malformed aim fields', () => {
  const base = { v: 2, subject: null, activity: null, waiver: null };
  // Retired collector-era fields normalize away instead of rejecting —
  // the change name survives.
  assert.deepEqual(
    parseTitleState({
      ...base,
      work: {
        change: 'deck',
        schemaName: 'spec',
        artifacts: 'nope',
        currentArtifact: '',
        awaitingValidation: 'yes',
        focusAt: -5,
        focusStale: 'no',
      },
    })?.work,
    { change: 'deck' },
  );
  // Wrong-typed aim fields reject the whole object.
  const malformed = [
    { change: 'deck', artifactName: 7 },
    { change: 'deck', artifactIdx: 4 },
    { change: 'deck', nextStep: 9 },
    { change: 'deck', artifactIdx: 'x'.repeat(33) },
    { change: 'deck', task: 'x'.repeat(33) },
  ];
  for (const work of malformed) {
    assert.equal(parseTitleState({ ...base, work }), null, JSON.stringify(work));
  }
});

test('parser normalizes retired attention facts away instead of rejecting', () => {
  const base = { v: 2, subject: null, activity: null, waiver: null };
  assert.deepEqual(
    parseTitleState({
      ...base,
      work: {
        change: 'deck',
        awaitingValidation: true,
        focusAt: 4_000,
        focusStale: true,
      },
    })?.work,
    { change: 'deck' },
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
    aim: {
      change: 'observe-room-aim',
      artifactName: '4-execute',
      artifactIdx: '4/4',
      task: '4/12',
      nextStep: 'eospec approve',
      mtimeMs: 0,
    },
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
    aim: {
      change: 'observe-room-aim',
      artifactName: '4-execute',
      artifactIdx: '4/4',
      task: '4/12',
      nextStep: 'eospec approve',
      mtimeMs: 0,
    },
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

test('the room aim owns the work slot verbatim', () => {
  const aim = {
    change: 'observe-room-aim',
    artifactName: '4-execute',
    artifactIdx: '4/4',
    task: '4/12',
    nextStep: 'eospec approve',
    mtimeMs: 0,
  };
  // The builder routes the aim into the work slot verbatim; the subject
  // never sees it.
  const built = buildTitleState({
    subject: { state: 'set', title: 'Session subject' },
    aim,
  });
  assert.equal(built.subject, 'Session subject');
  assert.deepEqual(built.work, {
    change: 'observe-room-aim',
    artifactName: '4-execute',
    artifactIdx: '4/4',
    task: '4/12',
    nextStep: 'eospec approve',
  });
  // Missing fields drop out — absence, never zeros or empty strings.
  assert.deepEqual(aimTitleWork({ change: 'observe-room-aim', mtimeMs: 0 }), {
    change: 'observe-room-aim',
  });
  // Without an aim there is no work opinion at all.
  const quiet = buildTitleState({
    subject: { state: 'set', title: 'Session subject' },
  });
  assert.equal(quiet.work, null);
  // Parse round-trip: the aim fields survive the wire contract.
  const parsed = parseTitleState({
    v: 2,
    subject: 'Session subject',
    work: { change: 'observe-room-aim', nextStep: 'eospec approve' },
    activity: null,
    waiver: null,
  });
  assert.equal(parsed?.work?.nextStep, 'eospec approve');
  // Overlong next-step text rejects the whole work object on parse.
  assert.equal(
    parseTitleState({
      v: 2,
      subject: 'Session subject',
      work: { change: 'observe-room-aim', nextStep: 'x'.repeat(181) },
      activity: null,
      waiver: null,
    }),
    null,
  );
});
