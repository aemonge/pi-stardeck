# Plan: The quiet activity row retires when idle

## Scope

Deck-side only, `packages/pi-stardeck` (deck.ts + tests), plus one
spec line in the living deck-title-state delta. No docs mention the
band (verified: no hits in docs/ or README).

## Current state (verified)

- `activityTile` (deck.ts ~330): dim `awaiting Human` when
  `title.activity` is null (or no title state and no legacy label);
  real labels in `text` otherwise.
- `turnCostTile` (deck.ts ~352): dim `— · 0 tok` when
  `turn.tokens <= 0 && turn.elapsedMs <= 0`; `''` with no meter;
  `this turn N · MM:SS` in accent otherwise.
- Assembly (renderHeaderDeck ~800): `rows = [line1, solidRule,
  ...titleRows, dottedRule, activityRow, ...spanTreeRows, ...(engine
  seam + engineRow)]` — the dotted seam belongs to the line-3 band.
- Idle fixtures render 7 lines; ~8 test sites assert the idle row
  (mockup regex `^awaiting Human\s+— · 0 tok$`, line counts, idle
  tile scans at deck.test.ts 137-139, 512, 574-577, 841-843,
  1137-1147, 1201-1210, 1230-1231, 1262, 1540-1541, 1614).

## Design decisions

1. **Band-speech predicate** — `activityBandSpeaks(state)`: activity
   side speaks when `title.activity != null` (or legacy
   `activityLabel(state)` is truthy); cost side speaks when a turn
   meter exists with `tokens > 0 || elapsedMs > 0`. OR of the two.
2. **Conditional band + seam** — compute `spanRows` once; emit the
   pre-band dotted seam only when `activityBandSpeaks ||
   spanRows.length > 0` (spans keep their home beneath the seam);
   emit `activityRow` only when the band speaks. Both idle and no
   spans: title rows flow straight to the engine seam — a 3-band
   deck, mirroring the retired conditional goal rows.
3. **Spec** — amend the four-line layout listing in
   `eight-section-deck/specs/deck-title-state/spec.md` (~line 63):
   line 3 is conditional, rendered only while activity or per-turn
   cost speaks; idle + zero-cost hides the band with its seam.
4. **Tests** — flip idle-presence assertions to absence (counts 7→5,
   mockup regex to engine-row content); new tests: hide-when-both-
   idle, show-when-cost-speaks (awaiting Human + real cost), show-
   when-activity-speaks (zero cost), no-double-seam when hidden and
   spanless, spans keep seam when band hides.

## Verification

`npm run check` in packages/pi-stardeck; root `npm run check`;
reviewer pass; Human visual validation via the existing local
`pi install` link; ships with the 0.9.2 release.

## Amendment (Human-validated feedback, 2026-10-20): band honesty

Two defects surfaced during live validation: the left label showed
`awaiting Human` while the turn was thinking or between tools, and a
finished tool's label lingered (updates felt post-hooked).

1. `TitleActivityFeed.finish(toolCallId)` — clears the current activity
   when its authoring call ends (owner tracking; subagent updates re-own
   the container). Wired at `tool_execution_end`, pre-published.
2. `observedActivityLabel` (deck.ts) — title-state activity first, else
   the header's kind-based live phase word (`interpreting`, `updating`,
   …), else empty; `awaiting Human` renders only when nothing speaks.
   The band now appears at turn start with the phase word — also
   curing the turn-start flicker risk from the first review.
