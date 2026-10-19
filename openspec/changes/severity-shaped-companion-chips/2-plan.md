# Plan: Severity-shaped companion chips

## Scope

Deck-side only, `packages/pi-stardeck`. No data changes: `nativeStatuses`
text and the devbox flag already arrive; this slice is pure presentation
(shape + stronger color) plus test re-baselining.

## Current state (verified)

- `identityCluster` (deck.ts:424-468) builds the line-1 corner head:
  devbox lead chip `color('success', '[\u{F01A7}]', bold)` — always
  bracketed — then companions from `KNOWN_COMPANION_ICONS`
  (engram ↻ `bracket: true`, graphify ⌬, appa ⛨), engram always
  bracketed, others bare at one icon.
- `companionIconColor` (deck.ts:415) — "color is the only state
  signal": inactive → `muted`, `COMPANION_WARNING_PATTERN` (warn-grade
  AND error-grade words lumped) → `warning`, else `accent`. All chips
  already render bold.
- `loud()` (deck.ts:216) = reverse-video wrap, used today only for the
  line-4 error count.
- Bare→bare spacing keeps the 0.7.1 double-gap rule via
  `trailingBare`; bracketed chips single-space.
- Tests pinning today's render: devbox lead (`deck.test.ts:1301`),
  enram ready (`:1254`), graphify stale (`:1359`), appa unreachable
  (`:1578`, `:1636`), graphify active (`:1698`).

## Design decisions

1. **Shape encodes severity** — new `companionShape(state)`:
   `error|off → '[icons]'`, `degraded → '(icons)'`, `healthy → icons`
   bare. The `bracket` identity flag on `KNOWN_COMPANION_ICONS` and the
   `icons.length > 1` auto-bracket rule are retired — shape is the only
   bracket authority. Bare→bare double-gap rule unchanged.
2. **Regex splits** — `COMPANION_WARNING_PATTERN` becomes two:
   degrade-grade `warn|stale|update recommended|needs attention` and
   error-grade `error|fail|down|unreachable|unhealthy`. `off`
   (no published status) counts as error-grade shape, muted color.
3. **Color stays fine-grained under shape** — healthy `accent`,
   degraded `warning`, error `error`, off `muted`; so brackets never
   collapse off vs error for color-sighted terminals.
4. **Devbox joins the law** — same shape function; healthy devbox is
   bare `󰆧` (success-colored, bold), degraded `(󰆧)`, down `[󰆧]`.
   The always-bracketed render is retired.
5. **Stronger pass** — degraded and error chips escalate to `loud()`
   (reverse-video, already bold); healthy/off chips keep plain bold.
   Enclosure glyphs inherit the chip's semantic color.
6. **Width** — cluster becomes state-dependent (all-error widest, +4
   cols vs all-healthy); corner yield ladder unchanged, accepted jiggle.

## Risks

- Parens around full-height glyphs (`(⌬)`, `(⛨)`) may sit low in some
  terminals — eyeball in situ during Step 3; fallback is raising with a
  hairline space, decided at execution, not spec'd now.
- Reverse-video on a busy line-1 corner could read noisy if several
  chips degrade at once; capped naturally at four chips, accepted.
- Test churn is the bulk of the diff: six pinned cases re-baseline to
  shape+loud expectations, plus new mixed-state cases (the norm).
