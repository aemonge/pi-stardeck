import assert from 'node:assert/strict';
import test from 'node:test';
import { TurnCostMeter } from '../src/turn-cost.ts';

function clock(start: number) {
  let now = start;
  return {
    tick: (advanceMs: number): void => {
      now += advanceMs;
    },
    now: (): number => now,
  };
}

test('a fresh meter reads zero tokens and zero elapsed', () => {
  const meter = new TurnCostMeter(clock(1_000).now);
  assert.deepEqual(meter.snapshot(), { tokens: 0, elapsedMs: 0 });
});

test('mid-turn usage accumulates with running elapsed time', () => {
  const time = clock(10_000);
  const meter = new TurnCostMeter(time.now);
  meter.begin();
  time.tick(4_000);
  assert.equal(
    meter.addUsage({ input: 3_000, output: 800, cacheRead: 400, cacheWrite: 0 }),
    true,
  );
  time.tick(34_000);
  assert.deepEqual(meter.snapshot(), { tokens: 4_200, elapsedMs: 38_000 });
});

test('multiple provider responses accumulate across the turn', () => {
  const time = clock(0);
  const meter = new TurnCostMeter(time.now);
  meter.begin();
  meter.addUsage({ input: 1_000, output: 500, cacheRead: 100, cacheWrite: 0 });
  time.tick(5_000);
  meter.addUsage({ input: 900, output: 700, cacheRead: 0, cacheWrite: 300 });
  assert.deepEqual(meter.snapshot(), { tokens: 3_500, elapsedMs: 5_000 });
});

test('settling zeroes the meter for the idle read', () => {
  const time = clock(0);
  const meter = new TurnCostMeter(time.now);
  meter.begin();
  meter.addUsage({ input: 4_200 });
  time.tick(60_000);
  assert.notDeepEqual(meter.snapshot(), { tokens: 0, elapsedMs: 0 });
  meter.settle();
  time.tick(1_000);
  assert.deepEqual(meter.snapshot(), { tokens: 0, elapsedMs: 0 });
});

test('begin resets a previously settled or running meter', () => {
  const time = clock(0);
  const meter = new TurnCostMeter(time.now);
  meter.begin();
  meter.addUsage({ input: 9_999 });
  time.tick(90_000);
  meter.begin();
  time.tick(2_000);
  assert.deepEqual(meter.snapshot(), { tokens: 0, elapsedMs: 2_000 });
});

test('usage extraction ignores junk and non-positive counts', () => {
  const meter = new TurnCostMeter(clock(0).now);
  meter.begin();
  assert.equal(meter.addUsage(undefined), false);
  assert.equal(meter.addUsage('4,200'), false);
  assert.equal(meter.addUsage({ input: 'x', output: null }), false);
  assert.equal(meter.addUsage({ input: -5, output: 0, cacheRead: 0 }), false);
  assert.equal(meter.addUsage({ input: 1_000.4, output: 0.3 }), true);
  assert.deepEqual(meter.snapshot().tokens, 1_001);
});

test('elapsed time stops at the bounded ceiling', () => {
  const time = clock(0);
  const meter = new TurnCostMeter(time.now);
  meter.begin();
  time.tick(400 * 60 * 1_000);
  assert.equal(meter.snapshot().elapsedMs, (99 * 60 + 59) * 1_000 + 999);
});
