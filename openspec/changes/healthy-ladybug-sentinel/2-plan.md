# Plan: Healthy ladybug sentinel in the status slot

## Scope

Deck-side only, `packages/pi-stardeck`. One seam: `noticeTile`.

## Current state (verified)

- `noticeTile` (deck.ts) returns `''` when `collectDeckNotices` is
  empty; `renderHeaderDeck` then gives the machine ladder the full
  width and the engine row renders only when the ladder speaks.
- The emptiness is pinned by tests: mockup line-6 regexes end at
  `$5.16`, `endsWith('$5.16')` at 160, the full-tail regex at 60, and
  the `dim:healthy`-retired assertion.
- `safeText` strips `󰠭`; `alignedSingleRow` already handles a 1-cell
  right tile (truncating left with `…` on narrow frames).

## Design decisions

1. **Sentinel render** — `noticeTile` returns `color(theme, 'dim',
   '󰠭')` when notices are empty; the `⚠ …` path is untouched.
2. **Always speak** — `statusRight` is never `''`, so the engine row
   always renders and the machine ladder always yields the sentinel's
   cell (width − 2). A zero-telemetry deck still closes with dotted
   rule + right-aligned ladybug.
3. **No new yield rules** — the sentinel is 1 cell and rides the
   existing `alignedSingleRow` truncation; only the notice ladder's
   behavior on narrow frames (wholesale yield) stays as-is.

## Risks

- Clean-state test pins move (four `$`-anchored/`endsWith` assertions
  gain the trailing `󰠭`); the `dim:healthy` retired assertion becomes
  the sentinel assertion.
- Machine tail loses 2 columns at every width; verified the frozen
   full tail (46 cells) still fits at 60.

## Checks

- `npm --prefix packages/pi-stardeck test`
- Root typecheck + lint for the touched files
- `graphify update .`
