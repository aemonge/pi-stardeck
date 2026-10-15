import assert from 'node:assert/strict';
import test from 'node:test';

import { buildFooterTelemetryMessage, totalCostFromEntries } from '../src/telemetry.ts';

const assistantEntry = (total: unknown, extra: Record<string, unknown> = {}) => ({
  type: 'message',
  message: { role: 'assistant', usage: { cost: { total }, ...extra } },
});

test('totalCostFromEntries sums assistant usage cost across the branch', () => {
  const entries = [
    assistantEntry(0.01),
    { type: 'message', message: { role: 'user', usage: { cost: { total: 5 } } } },
    assistantEntry(0.02),
    { type: 'tool_execution' },
    null,
  ];
  assert.equal(totalCostFromEntries(entries), 0.03);
});

test('totalCostFromEntries ignores malformed usage shapes', () => {
  const entries = [
    { type: 'message', message: { role: 'assistant', usage: null } },
    { type: 'message', message: { role: 'assistant', usage: { cost: null } } },
    {
      type: 'message',
      message: { role: 'assistant', usage: { cost: { total: '1' } } },
    },
    {
      type: 'message',
      message: { role: 'assistant', usage: { cost: { total: Number.NaN } } },
    },
    { type: 'message', message: { role: 'assistant', usage: { cost: { total: -3 } } } },
    'not-an-entry',
  ];
  assert.equal(totalCostFromEntries(entries), 0);
});

test('totalCostFromEntries clamps negative finite costs to zero', () => {
  assert.equal(totalCostFromEntries([assistantEntry(2), assistantEntry(-2)]), 2);
});

test('buildFooterTelemetryMessage produces the deck snapshot contract', () => {
  assert.deepEqual(buildFooterTelemetryMessage(0.03), {
    protocol: 1,
    type: 'snapshot',
    totalCost: 0.03,
  });
});

test('buildFooterTelemetryMessage omits quota when the seam is empty', () => {
  const message = buildFooterTelemetryMessage(1);
  assert.equal('quotaPercent' in message, false);
});

test('buildFooterTelemetryMessage clamps quota percent into 0-100', () => {
  assert.equal(buildFooterTelemetryMessage(1, { percent: 120 }).quotaPercent, 100);
  assert.equal(buildFooterTelemetryMessage(1, { percent: -5 }).quotaPercent, 0);
  assert.equal(buildFooterTelemetryMessage(1, { percent: 41.5 }).quotaPercent, 41.5);
});

test('buildFooterTelemetryMessage sanitizes non-finite cost input', () => {
  assert.equal(buildFooterTelemetryMessage(Number.NaN).totalCost, 0);
  assert.equal(buildFooterTelemetryMessage(-1).totalCost, 0);
});
