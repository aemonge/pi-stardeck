import assert from 'node:assert/strict';
import test from 'node:test';

import { parseFooterTelemetry } from '../../pi-stardeck/src/gauge.ts';
import { buildFooterTelemetryMessage } from '../src/telemetry.ts';

// Parity: everything this provider emits must survive the deck's own parser
// unchanged — the deck is the consumer, so its validator is the contract.
test("provider snapshots pass the deck's parseFooterTelemetry", () => {
  const plain = buildFooterTelemetryMessage(0.42);
  assert.deepEqual(parseFooterTelemetry(plain), { totalCost: 0.42 });

  const withQuota = buildFooterTelemetryMessage(2, { percent: 63.5 });
  assert.deepEqual(parseFooterTelemetry(withQuota), {
    totalCost: 2,
    quotaPercent: 63.5,
  });

  const clamped = buildFooterTelemetryMessage(0, { percent: 250 });
  assert.deepEqual(parseFooterTelemetry(clamped), { totalCost: 0, quotaPercent: 100 });
});

test('zero-cost sessions still validate', () => {
  assert.deepEqual(parseFooterTelemetry(buildFooterTelemetryMessage(0)), {
    totalCost: 0,
  });
});
