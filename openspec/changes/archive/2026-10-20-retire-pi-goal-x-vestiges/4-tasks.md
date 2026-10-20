# Tasks: Retire every pi-goal-x vestige from pi-stardeck

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Step 1 — packages/status removal

- [x] 1.1 Delete `src/goal.ts` and `src/goal-block.ts`
- [x] 1.2 Strip `'focus/goal'` from ledger + reducer + types selection
- [x] 1.3 Strip goal from publisher (widget, selection, openGoals,
      helpers) and active-work title
- [x] 1.4 Strip goal runtime from `index.ts` (state, polling,
      suppression, seeding, takeover install)
- [x] 1.5 Delete `goal.test.ts` / `goal-block.test.ts`, prune goal
      cases in ledger/reducer/publisher/parity/active-work tests
- [x] 1.6 `npm run check` green in packages/status (164/164 tests)

## Step 2 — packages/pi-stardeck removal

- [x] 2.1 Remove open-goal notice + `'goal'` key filters from `deck.ts`
- [x] 2.2 Remove goal badge/tree/detail rendering, `GOAL_STATUS_COLORS`,
      `formatGoalElapsed` from `deck.ts` (keep `formatTokens`)
- [x] 2.3 Remove goal selection source/detail type and `openGoals`
      parsing from `gauge.ts`
- [x] 2.4 Prune goal cases in deck/gauge tests; empty-notices still
      render the ladybug sentinel
- [x] 2.5 `npm run check` green in packages/pi-stardeck (149/149 tests)

## Step 3 — pi-vim-top-border + docs + spec

- [x] 3.1 Drop `'galactica.goal'` from prompt-rail lists; stages green
      (lint env quirk: shell BIOME_CONFIG_PATH hijack, pre-existing;
      biome/eslint/typecheck/tests individually green)
- [x] 3.2 Update docs/architecture.md, docs/status-architecture.md,
      docs/source-inventory.md, packages/status/README.md,
      packages/pi-stardeck/README.md
- [x] 3.3 Amend `eight-section-deck` spec delta (goal rows + hint
      scenarios); leave `archive/` untouched

## Step 4 — gate & close

- [x] 4.1 Root `npm run check` green (baseline re-pinned 96 files;
      format/lint/typecheck/tests/composition/openspec all PASS)
- [x] 4.2 `grep -ri "goal" packages/` audit — intentional hits only
- [x] 4.3 Reviewer pass on the diff (all six criteria PASS)
- [x] 4.4 Archive the change; remind Human to bump/repub/reinstall
      (reminder delivered in session close-out; release held for
      ladybug-session-id validation so both ship in one bump)

  gate-attributed · tool: bash · paths: — · at 2026-10-20T06:59:58Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:00:07Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-20T07:03:05Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:03:56Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:03:56Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:04:14Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:07:30Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:07:30Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:07:33Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:07:46Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:08:37Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:09:27Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/ledger.ts · at 2026-10-20T07:09:49Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/reducer.ts · at 2026-10-20T07:09:49Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/types.ts · at 2026-10-20T07:09:49Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/active-work.ts · at 2026-10-20T07:09:49Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/publisher.ts · at 2026-10-20T07:10:14Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/publisher.ts · at 2026-10-20T07:10:29Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/deck.ts · at 2026-10-20T07:11:01Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-10-20T07:11:05Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/gauge.ts · at 2026-10-20T07:11:13Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-10-20T07:11:24Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-10-20T07:11:46Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/ledger.test.ts · at 2026-10-20T07:11:49Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/reducer.test.ts · at 2026-10-20T07:11:49Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/parity.test.ts · at 2026-10-20T07:11:49Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/publisher.test.ts · at 2026-10-20T07:12:05Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/gauge.test.ts · at 2026-10-20T07:12:24Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/fixtures/fancy-footer.json · at 2026-10-20T07:12:24Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-vim-top-border/prompt-rail.ts · at 2026-10-20T07:12:24Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:12:59Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:13:11Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/README.md · at 2026-10-20T07:13:30Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:13:38Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:13:38Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:14:03Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:14:13Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:14:29Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:14:37Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:14:39Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:14:52Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:15:05Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:15:13Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:15:24Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:15:44Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:15:47Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:15:51Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:15:58Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/types.ts · at 2026-10-20T07:16:09Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:16:18Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:16:23Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/ledger.ts · at 2026-10-20T07:17:00Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:17:09Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:17:30Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:17:52Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:18:06Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/README.md · at 2026-10-20T07:19:18Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:19:33Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:19:52Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:20:10Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:20:42Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:20:59Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-10-20T07:21:24Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:21:30Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-10-20T07:21:49Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:21:52Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-20T07:23:35Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:31:47Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T07:32:07Z

  gate-attributed · tool: mem_save · paths: — · at 2026-10-20T07:33:44Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T08:20:00Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T08:20:43Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T08:20:53Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T08:21:06Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T08:21:11Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T08:22:10Z
