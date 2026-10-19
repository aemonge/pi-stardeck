/**
 * Quota seam. The registry ships empty by design: providers land here as
 * sibling registrations (z.ai first; Codex/Claude later) and the deck row
 * gains its gauge back without any renderer change.
 */
export interface QuotaWindow {
  /** Human label for the window, e.g. `5h`, `7d`. */
  label: string;
  /** Window usage, 0–100. */
  percent: number;
  /** Reset deadline, unix seconds, when the source reports one. */
  resetAt?: number;
}

export interface QuotaSnapshot {
  /** Whole-session quota usage, 0–100. */
  percent: number;
  /**
   * Windowed usage when the source distinguishes them (z.ai: the 5h
   * coding window and the 7d weekly cap). Additive and optional: the
   * deck keeps rendering `percent` alone when absent.
   */
  windows?: readonly QuotaWindow[];
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
