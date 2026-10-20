# Execution: Ladybug sentinel carries the short session id

## Steps

1. `packages/pi-stardeck/index.ts` — capture `sessionShortId` at
   `session_start` (8-char hex of `ctx.sessionManager.getSessionId()`),
   reset it with the other per-session facts, pass it into the
   `renderHeaderDeck` state.
2. `packages/pi-stardeck/src/deck.ts` — add `sessionShortId?` to
   `HeaderDeckState`; `noticeTile` gains a width param and renders the
   `accent`/`thinkingHigh` cluster when clean + id + width ≥ 24;
   dim single bug otherwise.
3. `packages/pi-stardeck/test/deck.test.ts` — cluster, omit, degrade,
   and census-with-id tests.
4. Spec amendment in `eight-section-deck` deck-title-state clean
   scenario; docs sweep for sentinel descriptions.
5. `npm run check` green (package + root); reviewer pass; Human
   visual validation.

## Acceptance

- Clean frame with a session: `󰠭 xxxxxxxx 󰠭` right end, blue bugs +
  purple id in the maintainer theme; no notices displaced, no goal
  text ever.
- Clean frame without an id (or < 24 cols): dim `󰠭` exactly as today.
- Notices present: `⚠ …` full slot, no id in the row.
- Root `npm run check` green; reviewer PASS; archived after Human
  validation; ships with 0.9.2 alongside the goal retirement.
