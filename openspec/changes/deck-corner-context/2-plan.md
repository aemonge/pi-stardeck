# Plan: Deck corner gains context and summary counts

## Scope

Deck-side only, `packages/pi-stardeck`. No data dependencies: context
percent and compaction count already arrive; the weekly calendar renders
when `quotaWindows` exists (fed by `zai-quota-provider` later).

## Current state (verified)

- `machineCornerSegments` (deck.ts) builds the corner tail in frozen
  order: `flame? › 󰍛 cpu › 󰘚 mem › mcp? › 󰜦 cost`, joined by minor `›`.
- `modelGroupLeft` (deck.ts) owns line 4 left: `globalLeft` (model ›
  thinking) `⟩ ctx › compactions › simpleQuotaTile`, where ctx wears
  warning at ≥ 85% and `simpleQuotaTile` renders the calendar (`d`
  window) or the whole-session `quotaPercent` when no windows exist.
- `deckCornerRight` drops the machine tail right-to-left before the path
  truncates below a 20-column floor; identity never drops.
- Line 4 right is notice-only (dim `healthy` when clean, 0.7.1).

## Design decisions

1. **Corner segments** — `machineCornerSegments` gains two segments
   between mcp and cost: `󰾆 <ctx>%` (contextPercent, warning ≥ 85%) and
   `󰎞 <n>` (compactionCount > 0). Frozen order becomes
   `flame? › cpu › mem › mcp? › ctx › sums › cost`.
2. **Engine group slims** — `modelGroupLeft` loses the ctx and
   compaction segments (and the ctxColor ladder with them); it becomes
   `globalLeft › simpleQuotaTile?`. The weekly calendar keeps its
   engine-left home; the no-windows `quotaPercent` tile stays there too.
3. **Colors** — context keeps warning ≥ 85% (moves with the segment);
   compaction renders in the context color as it does today; separators
   stay neutral; icons unchanged.
4. **Yield ladder** — unchanged mechanism, longer tail: cost drops
   first, then sums, then ctx, then mcp, then mem, then cpu, then flame;
   identity cluster never drops; path floor stays 20.

## Risks

- Corner width grows ~14 columns at full richness; mitigated by the
  yield ladder plus the existing git-yield below 79.
- Line-4 snapshot churn in deck.test.ts (engine-left regexes lose
  `󰾆 38% › 󰎞 2`, corner regexes gain them); update tests to the new
  contract, keep the always-visible and warning-color cases.

## Checks

- `npm test` scoped to packages/pi-stardeck deck tests (all green)
- Full `npm run check` battery
- `check-baseline --write`, `graphify update .`
