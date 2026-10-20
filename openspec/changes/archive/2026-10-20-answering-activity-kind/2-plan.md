# Plan: The answering phase speaks as an activity kind

## Scope

One additive kind across four exhaustive maps, one publisher call,
tests, gates. Companion amendment to the archived
`2026-10-20-quiet-activity-row` (its execution log records this fix).

## Steps

1. `HEADER_ACTIVITY_KINDS` += `'answering'` in
   packages/status/src/publisher.ts and
   packages/pi-stardeck/src/gauge.ts (mirrored unions, same release).
2. Label maps: deck.ts `ACTIVITY_LABELS.answering = 'answering'`;
   title.ts entry `{ full: 'answering the Human', compact:
   'answering' }`.
3. `markAnswering()` publishes `{ kind: 'answering' }` instead of
   clearing the live activity projection (packages/status/index.ts).
4. Deck test: `activity: { kind: 'answering' }` + accruing cost →
   `answering` renders, never `awaiting Human`.
5. Full gates (both packages + root); reviewer if time-boxed Human
   validation repeats; commit.

## Acceptance

- Mid-turn prose streaming shows `answering · this turn N · MM:SS`,
  never `awaiting Human` with a live meter.
- Settle still clears the projection → `awaiting Human` → band
  retires at zero cost (quiet-activity-row behavior preserved).
- typecheck enforces map completeness on both label Records.
