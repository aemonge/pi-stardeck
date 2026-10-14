import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyTitleActivity, TitleActivityFeed } from '../src/title-activity.ts';

function subagentPartial(agents: Array<{ agent?: string; active: boolean }>): unknown {
  return {
    details: {
      kind: 'pi-subagent',
      results: agents.map((entry) => ({
        ...(entry.agent ? { agent: entry.agent } : {}),
        exitCode: -1,
        sawAgentStart: true,
        sawAgentSettled: !entry.active,
      })),
    },
  };
}

test('an edit tool start publishes editing owned by the turn span', () => {
  const feed = new TitleActivityFeed();
  assert.equal(
    feed.begin('t87', 'edit', { path: 'packages/header/src/deck.ts' }, 'turn-3'),
    true,
  );
  assert.deepEqual(feed.current(), {
    class: 'editing',
    target: 'packages/header/src/deck.ts',
    span: 'turn-3',
    parent: null,
  });
});

test('read and ls starts publish reading with the path target', () => {
  const feed = new TitleActivityFeed();
  feed.begin('r1', 'read', { path: 'schema.yaml' }, 'turn-1');
  assert.deepEqual(feed.current(), {
    class: 'reading',
    target: 'schema.yaml',
    span: 'turn-1',
    parent: null,
  });
  feed.begin('r2', 'ls', {}, 'turn-1');
  assert.deepEqual(feed.current(), {
    class: 'reading',
    target: '.',
    span: 'turn-1',
    parent: null,
  });
});

test('grep and find starts publish grepping with the pattern target', () => {
  const feed = new TitleActivityFeed();
  feed.begin('g1', 'grep', { pattern: 'galactica-status:header' }, 'turn-1');
  assert.deepEqual(feed.current()?.class, 'grepping');
  assert.equal(feed.current()?.target, 'galactica-status:header');
  feed.begin('g2', 'find', { pattern: '*.md' }, 'turn-1');
  assert.equal(feed.current()?.target, '*.md');
});

test('a bash start owns its span id under the turn', () => {
  const feed = new TitleActivityFeed();
  feed.begin('b1', 'bash', { command: 'npm --prefix packages/status test' }, 'turn-2');
  assert.deepEqual(feed.current(), {
    class: 'bash',
    target: 'npm --prefix packages/status test',
    span: 'b1',
    parent: 'turn-2',
  });
});

test('a subagent start carries the parent span id and agent target', () => {
  const feed = new TitleActivityFeed();
  feed.begin(
    's1',
    'subagent',
    { calls: [{ agent: 'scout' }, { agent: 'reviewer' }] },
    'turn-4',
  );
  assert.deepEqual(feed.current(), {
    class: 'subagent',
    target: 'scout',
    span: 's1',
    parent: 'turn-4',
  });
  assert.deepEqual(classifyTitleActivity('subagent', { agent: 'verifier' }), {
    class: 'subagent',
    target: 'verifier',
  });
});

test('subagent updates publish the newest active per-agent child span', () => {
  const feed = new TitleActivityFeed();
  feed.begin('s1', 'subagent', { calls: [{ agent: 'scout' }] }, 'turn-4');
  const calls = [{ agent: 'reviewer' }, { agent: 'scout' }];
  assert.equal(
    feed.update(
      's1',
      'subagent',
      calls,
      subagentPartial([{ active: true }, { active: true }]),
      'turn-4',
    ),
    true,
  );
  assert.deepEqual(feed.current(), {
    class: 'subagent',
    target: 'scout',
    span: 's1:1',
    parent: 's1',
  });
  // Settled agents publish nothing new.
  assert.equal(
    feed.update(
      's1',
      'subagent',
      calls,
      subagentPartial([{ active: false }]),
      'turn-4',
    ),
    false,
  );
  assert.equal(feed.current()?.span, 's1:1');
});

test('unclassified tools are ignored and newest event wins', () => {
  const feed = new TitleActivityFeed();
  assert.equal(feed.begin('tf1', 'taskflow', { action: 'run' }, 'turn-1'), false);
  feed.begin('e1', 'write', { path: 'a.ts' }, 'turn-1');
  feed.begin('e2', 'edit', { path: 'b.ts' }, 'turn-1');
  assert.deepEqual(feed.current(), {
    class: 'editing',
    target: 'b.ts',
    span: 'turn-1',
    parent: null,
  });
  // A repeated identical event does not republish.
  assert.equal(feed.begin('e2', 'edit', { path: 'b.ts' }, 'turn-1'), false);
});

test('turn end resets the feed to null', () => {
  const feed = new TitleActivityFeed();
  feed.begin('e1', 'edit', { path: 'deck.ts' }, 'turn-9');
  assert.notEqual(feed.current(), null);
  assert.equal(feed.reset(), true);
  assert.equal(feed.current(), null);
  assert.equal(feed.reset(), false);
});

test('direct tools fall back to their call id without an active turn', () => {
  const feed = new TitleActivityFeed();
  feed.begin('x1', 'edit', { path: 'deck.ts' }, null);
  assert.deepEqual(feed.current(), {
    class: 'editing',
    target: 'deck.ts',
    span: 'x1',
    parent: null,
  });
});

test('target labels collapse whitespace and stop at 48 characters', () => {
  assert.equal(
    classifyTitleActivity('bash', { command: 'echo   a\n b' })?.target,
    'echo a b',
  );
  const long = classifyTitleActivity('read', {
    path: `packages/${'deep/'.repeat(20)}/deck.ts`,
  });
  assert.equal(Array.from(long?.target ?? '').length, 48);
  assert.ok(long?.target.endsWith('…'));
  assert.equal(classifyTitleActivity('read', {}), undefined);
  assert.deepEqual(classifyTitleActivity('subagent', {}), {
    class: 'subagent',
    target: 'subagent',
  });
});
