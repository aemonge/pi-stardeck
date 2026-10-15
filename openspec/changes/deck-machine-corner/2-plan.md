# Plan: Deck machine corner

## Scope

Deck-side only, `packages/pi-stardeck`. No data dependencies: CPU, memory,
cost, devbox, and companions all have live sources today. The quota flame
slot is structural only (renders empty until a QuotaProvider lands).

## Current state (verified)

- Line 1 left: `projectDeckLeft` prefixes `[󰆧]` to the path (deck.ts:388-397).
- Line 1 right: `extensionStatusCodes` chips (deck.ts:420-451) — engram
  `[↻ ▤]` (two icons, bracketed), graphify `⌬`, appa `⛨` bare; bare→bare
  pairs double-spaced; companion color from native-status text via
  `COMPANION_WARNING_PATTERN`.
- Line 4 right: `telemetryRowRight` (deck.ts:519-549) = windowQuotaTiles ·
  machine segments (CPU, memory, MCP n/m) · costTile, joined by `›`;
  renderDeck (deck.ts:771) yields the whole group to any notice.
- Machine readings have no icons; cpu `2.1%`, memory `812M`, cost `󰜦 $1.23`.

## Design decisions

1. **Corner assembly** — new `deckCorner(state, theme, nowMs)` builds
   `[devbox?] chips ⟩ machine` where machine = `[flame?] cpu › mem › mcp? ›
   cost` (frozen order from the 2.4 comment: flame, machine readings, cost).
   The devbox chip leads with its existing success color; absent when not
   devbox.
2. **Engram chip** — `KNOWN_COMPANION_ICONS` gains a per-companion
   `bracket` flag; engram becomes `icons: ['↻'], bracket: true` so it
   renders `[↻]` while remaining non-bare for spacing (single space to the
   next chip). Graphify/appa stay bare; devbox is a bracketed non-companion
   lead chip.
3. **Separators** — one major `⟩` (semanticSeparator) between chips and
   machine group; minor `›` (minorSeparator) between machine segments;
   equal single-space padding everywhere; separators stay neutral-colored.
4. **Line 1 rendering** — `renderDeck` line 1 becomes
   `alignedSingleRow(projectLeft, alert + corner, width)`; `projectDeckLeft`
   loses the devbox prefix. Alert tile stays leftmost of the corner cluster.
5. **Yield ladder** — metrics yield right-to-left before the path truncates:
   drop cost, then memory, then CPU, then MCP; devbox + companion chips
   never drop (always-visible contract). Implement by building the machine
   tail at decreasing richness and picking the longest whose full line keeps
   the path at or above a 20-column floor.
6. **Line 4 right is notice-only** — `telemetryRowRight` is deleted;
   `renderDeck` renders engine left + notice right. `windowQuotaTiles`,
   `simpleQuotaTile` (calendar stays on the engine-left group), `costTile`,
   and the machine segments move/re-home per decisions 1; the calendar tile's
   engine-left placement is untouched.
7. **Colors unchanged** — warning coloring stays per-chip (companions via
   native-status pattern; CPU/memory via cpuWarning/memoryWarning; quota
   percent tiers); separators neutral.

## Risks

- Width pressure on line 1 (corner ≈ 48 cols): mitigated by the yield ladder
  plus the existing git-yield below 79 columns.
- Snapshot churn in deck.test.ts (companion-chip expectations `[↻ ▤]` and
  line-4 machine-group expectations move to line 1): update tests with the
  new contract, keep the always-visible and warning-color cases.
- The eight-section-deck frozen spec describes line 4's right group; this
  change amends it Human-approved (conversation 2026-10-15) and records the
  amendment in 3-execution.md.

## Checks

- `npm test` scoped to packages/pi-stardeck deck tests (all green)
- Full `npm run check` battery
- `check-baseline --write`, `graphify update .`
