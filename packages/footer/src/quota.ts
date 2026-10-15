/**
 * Quota seam. The provider ships with no implementations: every quota source
 * this cockpit had (Codex OAuth, Claude OAuth, z.ai coding plan) is gone with
 * the previous footer module. A future slice registers a provider here
 * and the deck row gains its gauge back without any renderer change.
 */
export interface QuotaSnapshot {
  /** Whole-session quota usage, 0–100. */
  percent: number;
}

export interface QuotaProvider {
  readonly id: string;
  snapshot(): QuotaSnapshot | undefined;
}

const quotaProviders: QuotaProvider[] = [];

export function registerQuotaProvider(provider: QuotaProvider): void {
  if (quotaProviders.some(({ id }) => id === provider.id)) return;
  quotaProviders.push(provider);
}

export function activeQuotaProviders(): readonly QuotaProvider[] {
  return quotaProviders;
}
