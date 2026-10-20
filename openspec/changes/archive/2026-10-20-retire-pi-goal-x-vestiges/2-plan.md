# Plan: Retire every pi-goal-x vestige from pi-stardeck

## Scope

Dead goal-code removal across three packages plus docs and the living
deck spec. No behavior change beyond the goal surfaces disappearing.

## Verified inventory (pre-work audit, 2026-10-20)

**packages/status (publisher side)**
- delete `src/goal.ts` (170 lines: `GoalHeaderState`,
  `GOAL_HEADER_STATUSES`, branch restore, prompt marker,
  `pi-goal.json` turn-limit loader)
- delete `src/goal-block.ts` (377 lines: `resolveGoalRoot`,
  `loadPoolGoals`, `countOpenGoals`, `readGoalHeadline`,
  `renderGoalBlock`, `installGoalBlockTakeover` + reassert timers)
- `src/ledger.ts`: drop `'focus/goal'` from `LEDGER_EVENT_TYPES` and
  the `LedgerEvent` union; `isLedgerEvent` fail-softs unknown types on
  any adapter replay
- `src/reducer.ts`: drop goal fact, `kind: 'goal'` selection variant,
  `focus/goal` case
- `src/types.ts`: drop `SelectionState` goal variant + import
- `src/publisher.ts`: drop `galactica.goal` widget push,
  `headerSelection` goal branch, `HeaderStatusEvent.openGoals`,
  `goalHeaderLifecycle/ActivityPath/Color`
- `src/active-work.ts`: drop `goal` option from `formatActiveWorkTitle`
- `index.ts`: drop goal runtime state, 500 ms polling, projection
  suppression, seeding, `countOpenGoals` in publish, takeover install
- tests: delete `goal.test.ts`, `goal-block.test.ts`; prune goal cases
  in ledger/reducer/publisher/parity/active-work tests

**packages/pi-stardeck (consumer side, self-contained types)**
- `src/deck.ts`: drop the `⚠ N open goals · /goal-focus` notice, the
  `'goal'` native-status key filters, `goalBadgeTile`, `goalTreeLines`,
  goal detail rows, `GOAL_STATUS_COLORS`, `formatGoalElapsed`;
  `formatTokens` **stays** (turn-cost meter uses it)
- `src/gauge.ts`: drop `'goal'` from `HEADER_SELECTION_SOURCES`,
  `HeaderSelectionGoalDetail`, `goal?` field, `openGoals` parsing
- tests: prune openGoals + goal-badge cases in deck/gauge tests

**packages/pi-vim-top-border**
- `prompt-rail.ts`: drop `'galactica.goal'` from `TRACKED_WIDGET_IDS`
  and the `workWidget` priority list

**Docs & specs**
- `docs/architecture.md` ("OpenSpec, Goal, or Session Work"), 
  `docs/status-architecture.md` (goal events, selection kinds, producer
  list), `docs/source-inventory.md` (Goal column)
- amend the non-archived `eight-section-deck` spec delta: drop the goal
  progress-rows requirement and the open-goal hint scenario; `archive/`
  stays untouched as history

## Design decisions

1. **No compat flag** — nothing external consumes the goal wire fields;
   both sides of the channel live in this repo and ship together.
2. **Fail-soft contract retirement** — removing `'focus/goal'` from the
   frozen ledger event list is safe: `isLedgerEvent` rejects unknown
   types, adapters skip them, session branches keep their historical
   entries unread.
3. **Notice ladder untouched** — `collectDeckNotices` keeps blocked →
   approval → companion warnings → diagnostics ordering and waiver
   suppression; the ladybug sentinel path is unaffected.

## Verification

`npm run check` (format:check, typecheck, node --test) in status,
pi-stardeck, pi-vim-top-border; root `npm run check` (baseline, package
load, composition, openspec); `grep -ri "goal" packages/` audit for
intentional leftovers only.
