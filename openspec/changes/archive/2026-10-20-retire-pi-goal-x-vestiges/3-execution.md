# Execution: Retire every pi-goal-x vestige from pi-stardeck

> **Result (2026-10-20):** complete. 26 files changed (+48/−1864 vs the
> four-file deletion set), root `npm run check` green end-to-end
> (status 164/164, pi-stardeck 149/149, rail 37/37 tests; lint, format,
> typecheck, composition, openspec all PASS; baseline re-pinned 97
> files). Reviewer pass: all six acceptance criteria PASS. Sole
> surviving `goal` grep hit is a vim quick-wins table header in
> pi-vim-top-border's README (ordinary English).

## Steps

1. **packages/status** — delete `src/goal.ts` + `src/goal-block.ts`,
   strip goal plumbing from ledger, reducer, types, publisher,
   active-work, `index.ts`; prune/delete tests; package `npm run check`
   green.
2. **packages/pi-stardeck** — remove open-goal notice, `'goal'` key
   filters, goal badge/tree/detail rendering, `GOAL_STATUS_COLORS`,
   `formatGoalElapsed` from `deck.ts`; remove goal selection source,
   `HeaderSelectionGoalDetail`, `openGoals` parsing from `gauge.ts`;
   prune tests; package `npm run check` green.
3. **packages/pi-vim-top-border** — drop `'galactica.goal'` from
   prompt-rail lists; package `npm run check` green.
4. **Docs & spec** — update `docs/architecture.md`,
   `docs/status-architecture.md`, `docs/source-inventory.md`; amend the
   non-archived `eight-section-deck` spec delta.
5. **Gate** — root `npm run check`; `grep -ri "goal" packages/` audit;
   reviewer pass; archive.

## Acceptance

- No snapshot file present → deck renders the quiet ladybug `󰠭`, no
  goal text anywhere.
- `grep -ri "goal" packages/` returns only intentional hits (e.g.
  change-goal metadata in OpenSpec files, none in shipped code).
- typecheck + tests green in all touched packages; docs updated;
  change archived.

## Post-work (Human)

- Bump 0.9.1 → 0.9.2, republish, reinstall — the installed copy at
  `~/.pi/agent/npm/node_modules/@aemonge-dev/pi-stardeck` still ships
  the goal code until then.
- Optionally delete the stale `~/.pi/.goals-pool-snapshot.json`.
