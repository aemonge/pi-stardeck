import type { ExtensionContext } from '@earendil-works/pi-coding-agent';

import type { QuotaSnapshot } from './quota.ts';
import {
  FOOTER_TELEMETRY_PROTOCOL_VERSION,
  type FooterTelemetryMessage,
} from './protocol.ts';

function toCost(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

/**
 * Sums assistant usage cost over a session branch. Non-message entries,
 * non-assistant messages, and malformed usage contribute nothing, matching
 * the walk the deck row has consumed since 0.1.0.
 */
export function totalCostFromEntries(entries: readonly unknown[]): number {
  let totalCost = 0;
  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null) continue;
    const { type, message } = entry as { type?: unknown; message?: unknown };
    if (type !== 'message') continue;
    if (typeof message !== 'object' || message === null) continue;
    const { role, usage } = message as { role?: unknown; usage?: unknown };
    if (role !== 'assistant') continue;
    if (typeof usage !== 'object' || usage === null) continue;
    const cost = (usage as { cost?: unknown }).cost;
    if (typeof cost !== 'object' || cost === null) continue;
    totalCost += toCost((cost as { total?: unknown }).total);
  }
  return totalCost;
}

export function collectTotalCost(ctx: ExtensionContext): number {
  return totalCostFromEntries(ctx.sessionManager.getBranch());
}

export function buildFooterTelemetryMessage(
  totalCost: number,
  quota?: QuotaSnapshot,
): FooterTelemetryMessage {
  const cost =
    typeof totalCost === 'number' && Number.isFinite(totalCost)
      ? Math.max(0, totalCost)
      : 0;
  const percent =
    quota !== undefined &&
    typeof quota.percent === 'number' &&
    Number.isFinite(quota.percent)
      ? Math.min(100, Math.max(0, quota.percent))
      : undefined;
  return {
    protocol: FOOTER_TELEMETRY_PROTOCOL_VERSION,
    type: 'snapshot',
    totalCost: cost,
    ...(percent !== undefined ? { quotaPercent: percent } : {}),
  };
}
