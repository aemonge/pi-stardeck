import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import test from 'node:test';
import { parseRoomAim, readRoomAim } from '../src/room-aim.ts';

test('parse: the ratified five fields, verbatim', () => {
  const text = [
    '# one active change per room — eospec writes, verbs refresh',
    'change: truthful-rendered-state',
    'artifact-name: 4-execute',
    'artifact-idx: 4/4',
    'task: 4/12',
    'next-step: eospec approve',
    '',
  ].join('\n');
  assert.deepEqual(parseRoomAim(text, 5), {
    change: 'truthful-rendered-state',
    artifactName: '4-execute',
    artifactIdx: '4/4',
    task: '4/12',
    nextStep: 'eospec approve',
    mtimeMs: 5,
  });
});

// Render-matrix rows (observe-room-aim, Ruling 9): a missing field drops
// its segment — absence never becomes zero; `change` is the keystone.
test('parse: missing fields drop out, never zeros', () => {
  const full = parseRoomAim(
    'change: x\nartifact-name: 4-execute\nartifact-idx: 4/4\ntask: 4/12\nnext-step: eospec approve\n',
    1,
  );
  assert.deepEqual(
    { ...full, mtimeMs: 0 },
    {
      change: 'x',
      artifactName: '4-execute',
      artifactIdx: '4/4',
      task: '4/12',
      nextStep: 'eospec approve',
      mtimeMs: 0,
    },
  );
  // artifact_idx without artifact_name survives the parse — the group
  // drop is the renderer's law; parse never invents or deletes data.
  assert.deepEqual(
    { ...parseRoomAim('change: x\nartifact-idx: 4/4\n', 1), mtimeMs: 0 },
    { change: 'x', artifactIdx: '4/4', mtimeMs: 0 },
  );
  assert.deepEqual(
    { ...parseRoomAim('change: x\nnext-step: go\n', 1), mtimeMs: 0 },
    {
      change: 'x',
      nextStep: 'go',
      mtimeMs: 0,
    },
  );
});

test('parse: change is the keystone — no change, no aim', () => {
  assert.equal(parseRoomAim('', 1), undefined);
  assert.equal(parseRoomAim('artifact-name: 4-execute\n', 1), undefined);
  assert.equal(parseRoomAim('change:\n', 1), undefined);
  assert.equal(parseRoomAim('change:   \n', 1), undefined);
});

test('parse: garbage lines ignored, duplicate keys last-wins, unknown keys ignored', () => {
  const text = [
    'no colon here',
    ':leading-colon',
    'change: first',
    'change: second',
    'unknown: mystery',
    '# comment: not a field',
    'task: 1/2',
  ].join('\n');
  assert.deepEqual(
    { ...parseRoomAim(text, 1), mtimeMs: 0 },
    {
      change: 'second',
      task: '1/2',
      mtimeMs: 0,
    },
  );
});

test('parse: control characters collapse; overlong values drop their field', () => {
  assert.deepEqual(
    { ...parseRoomAim('change: a\u0000b\n', 1), mtimeMs: 0 },
    {
      change: 'a b',
      mtimeMs: 0,
    },
  );
  assert.equal(parseRoomAim(`change: ${'x'.repeat(121)}\n`, 1), undefined);
  const aim = parseRoomAim(`change: ok\nnext-step: ${'x'.repeat(181)}\n`, 1);
  assert.equal(aim?.nextStep, undefined);
  assert.equal(aim?.change, 'ok');
});

function scratch(): string {
  return mkdtempSync(join(tmpdir(), 'room-aim-'));
}

test('read: walk-up finds the nearest openspec root; absent file stays absent', () => {
  const root = scratch();
  try {
    mkdirSync(join(root, 'project', 'nested', 'deep'), { recursive: true });
    mkdirSync(join(root, 'project', 'openspec'), { recursive: true });
    writeFileSync(
      join(root, 'project', 'openspec', '.focus'),
      'change: aimed\n',
      'utf8',
    );
    const aim = readRoomAim(join(root, 'project', 'nested', 'deep'), 0);
    assert.equal(aim?.change, 'aimed');
    assert.equal(readRoomAim(join(root, 'elsewhere'), 0), undefined);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('read: mtime cache — same mtime re-serves, moved mtime re-reads', () => {
  const root = scratch();
  try {
    mkdirSync(join(root, 'openspec'), { recursive: true });
    const file = join(root, 'openspec', '.focus');
    writeFileSync(file, 'change: first\n', 'utf8');
    utimesSync(file, new Date(1000), new Date(1000));
    const first = readRoomAim(root, 0);
    assert.equal(first?.change, 'first');
    writeFileSync(file, 'change: second\n', 'utf8');
    // Same mtime: the cached aim survives even though the content moved.
    utimesSync(file, new Date(1000), new Date(1000));
    assert.equal(readRoomAim(root, 0)?.change, 'first');
    // Moved mtime: re-read.
    utimesSync(file, new Date(2000), new Date(2000));
    assert.equal(readRoomAim(root, 0)?.change, 'second');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('read: unparseable aim after mtime move degrades to no aim', () => {
  const root = scratch();
  try {
    mkdirSync(join(root, 'openspec'), { recursive: true });
    const file = join(root, 'openspec', '.focus');
    writeFileSync(file, 'change: first\n', 'utf8');
    utimesSync(file, new Date(1000), new Date(1000));
    assert.equal(readRoomAim(root, 0)?.change, 'first');
    writeFileSync(file, 'no keystone\n', 'utf8');
    utimesSync(file, new Date(2000), new Date(2000));
    assert.equal(readRoomAim(root, 0), undefined);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('read: walk limit is bounded — deep chains give up cleanly', () => {
  let root = tmpdir() + sep + 'room-aim-deep-' + Math.random().toString(36).slice(2);
  let cursor = root;
  mkdirSync(root, { recursive: true });
  try {
    for (let i = 0; i < 45; i += 1) {
      cursor = join(cursor, `d${i}`);
      mkdirSync(cursor, { recursive: true });
    }
    assert.equal(readRoomAim(cursor, 0), undefined);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
