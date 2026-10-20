# Execution: The quiet activity row retires when idle

## Steps

1. `packages/pi-stardeck/src/deck.ts` — `activityBandSpeaks(state)`
   predicate; conditional `activityRow` + conditional pre-band seam in
   `renderHeaderDeck` (span rows computed once, seam kept for spans).
2. `packages/pi-stardeck/test/deck.test.ts` — flip idle-presence
   assertions; add hide/show/no-double-seam/spans-keep-seam tests.
3. Spec amendment in `eight-section-deck` deck-title-state layout
   listing (~line 63).
4. `npm run check` green (package + root); reviewer pass; Human
   visual validation; archive with the 0.9.2 release.

## Acceptance

- Idle frame (no activity, zeroed/absent meter): no activity row, no
  orphan dotted seam — title band flows to the status seam.
- Cost-bearing idle (`awaiting Human` + `this turn 1.2k · 0:42`): row
  stays.
- Active frame (any activity label, zero cost): row stays.
- Spans present while band idle: spans render beneath their seam.
- Root `npm run check` green; reviewer PASS; archived; ships 0.9.2.
