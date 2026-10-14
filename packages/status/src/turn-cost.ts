/**
 * Per-turn cost meter for the title-state publisher (`deck-title-state`).
 *
 * Sums provider usage deltas across the assistant messages of the current
 * turn and measures turn elapsed time. `before_agent_start` resets it; a
 * settled (idle) session reads zero so the deck's line 3 shows `— · 0 tok`.
 */

export type TurnCostSnapshot = { tokens: number; elapsedMs: number };

/** Matches the span-idle convention: 99m59s999ms. */
const MAX_ELAPSED_MS = (99 * 60 + 59) * 1_000 + 999;

function usageTokens(value: unknown): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0;
  const usage = value as Record<string, unknown>;
  let tokens = 0;
  for (const key of ['input', 'output', 'cacheRead', 'cacheWrite'] as const) {
    const count = usage[key];
    if (typeof count === 'number' && Number.isFinite(count) && count > 0) {
      tokens += count;
    }
  }
  return Math.round(tokens);
}

export class TurnCostMeter {
  private tokens = 0;
  private startedAt: number | null = null;
  private readonly now: () => number;

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  /** Reset at `before_agent_start`: zero tokens, elapsed from now. */
  begin(): void {
    this.tokens = 0;
    this.startedAt = this.now();
  }

  /** Add one provider response's usage; returns true when tokens accrued. */
  addUsage(usage: unknown): boolean {
    const tokens = usageTokens(usage);
    if (tokens <= 0) return false;
    this.tokens += tokens;
    return true;
  }

  /** Zero the meter when the turn settles so idle reads `{tokens:0,elapsedMs:0}`. */
  settle(): void {
    this.tokens = 0;
    this.startedAt = null;
  }

  snapshot(): TurnCostSnapshot {
    const elapsedMs =
      this.startedAt === null
        ? 0
        : Math.max(0, Math.min(MAX_ELAPSED_MS, this.now() - this.startedAt));
    return { tokens: this.tokens, elapsedMs };
  }
}
