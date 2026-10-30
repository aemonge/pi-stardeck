# Execute

> Spec: simplify-session-focus-surface · state legend: [ ] open · [x] done · ~ skipped

## Slice 1 — Fold awaiting-validation into openspec focus

- [x] extend `OpenSpecFocus` (`TaskOpenSpecFocus.awaitingValidation: boolean`) in `src/active-work.ts`
      started_at: 2026-10-30T12:08:00Z · ended_at: 2026-10-30T12:26:00Z · total: ~18m · check: tsc --noEmit clean · prettier clean · status tests 171/171 · composition probe PASS · baseline refreshed PASS · paths: packages/status/src/active-work.ts
- [x] parse/restore round-trip; legacy entries (flag absent) parse as false
      started_at: 2026-10-30T12:08:00Z · ended_at: 2026-10-30T12:26:00Z · total: — · check: unit test `round-trips and degrades for legacy entries` · paths: packages/status/src/active-work.ts, packages/status/test/active-work.test.ts
- [x] `validate` action; auto-clear on `set`/`replace`/`clear`; messages state the flag (replace-guard now compares task identity via `sameTaskFocus` — same-task set re-clears without demanding replace)
      started_at: 2026-10-30T12:08:00Z · ended_at: 2026-10-30T12:26:00Z · total: — · check: runtime test `validate marks awaiting Human validation and auto-clears` (tool + slash command parity) · paths: packages/status/index.ts, packages/status/test/active-work.test.ts
- [x] runtime projection: flag drives `waiting · awaiting-validation` mid-turn (constructor seed + `setFocus`); work-focus-driven paths remain until Slice 3 retires them; frozen rest semantics preserved (task focus at settle keeps `waiting · awaiting-validation`, test L1251 unchanged)
      started_at: 2026-10-30T12:08:00Z · ended_at: 2026-10-30T12:26:00Z · total: — · check: `latestHeaderWork(...).lifecycle === 'waiting'` assertion · paths: packages/status/index.ts
- [x] `/openspec-focus validate` verb
      started_at: 2026-10-30T12:08:00Z · ended_at: 2026-10-30T12:26:00Z · total: — · check: command-parity assertion in validate lifecycle test · paths: packages/status/index.ts
- [x] flag lifecycle, projection wiring, old-entry compat tests
      started_at: 2026-10-30T12:08:00Z · ended_at: 2026-10-30T12:26:00Z · total: — · check: 2 new tests + 16 updated assertions across parity/publisher/reducer/title-state suites, all green · paths: packages/status/test/
- [x] feat(status): fold awaiting-validation into openspec focus
      hash: 20b47ad9105bcfc28f213b7dac9dcd0e485a11de

## Slice 2 — Rename subject to title; rules move into descriptions

- [x] registration renamed to `title`; description carries the first-turn rule
      started_at: 2026-10-30T12:28:00Z · ended_at: 2026-10-30T12:36:00Z · total: ~8m · check: tsc clean · prettier clean · 173 status tests · description-content pins green · paths: packages/status/index.ts
- [x] both `promptGuidelines` arrays dropped; rules live in descriptions only (single source, per-request salience)
      started_at: 2026-10-30T12:28:00Z · ended_at: 2026-10-30T12:36:00Z · total: — · check: registration inspection tests · paths: packages/status/index.ts
- [x] `applySubjectAction`→`applyTitleAction`; messages `Title: …`; promptSnippet updated; persisted entry type unchanged for old-session compat
      started_at: 2026-10-30T12:28:00Z · ended_at: 2026-10-30T12:36:00Z · total: — · check: title tool test green · paths: packages/status/index.ts, packages/status/test/active-work.test.ts
- [x] tests: enum + description regression pins (the systematic-bug tombstone); sanitizer cap unchanged; local-load-probe EXPECTED_TOOLS updated
      started_at: 2026-10-30T12:28:00Z · ended_at: 2026-10-30T12:36:00Z · total: — · check: 173/173 + 24/24 · paths: packages/status/test/active-work.test.ts, test/local-load-probe.test.ts
- [x] feat(status): rename subject to title and carry rules in tool descriptions
      hash: e9e557770486c846a8bf2e5316d60568fa107e71

## Slice 3 — Retire work_focus and stage instruments

- [x] registrations, `applyWorkAction`, `declareStage`, `workStatus`, `/work` command deleted; unused imports dropped (`sessionWorkFocus`, `StageValue`)
      started_at: 2026-10-30T12:40:00Z · ended_at: 2026-10-30T13:05:00Z · total: ~25m · check: tsc clean · prettier clean · 171 status + 24 tooling tests · composition probe PASS (2 tools, 6 commands) · paths: packages/status/index.ts
- [x] restore readers and runtime render kept for legacy `session-work.v1` entries; `persistAndApplyWorkFocus` kept (acquisition-clearing of restored legacy work)
      started_at: 2026-10-30T12:40:00Z · ended_at: 2026-10-30T13:05:00Z · total: — · check: rewritten legacy tests (seeded entries) green · paths: packages/status/test/active-work.test.ts
- [x] `runtimeSpans.setStage` inference untouched; taskflow phase projection intact
      started_at: 2026-10-30T12:40:00Z · ended_at: 2026-10-30T13:05:00Z · total: — · check: taskflow live-activity tests green · paths: —
- [x] README + status-architecture updated; out-of-scope locksteps noted (gate `accountingTools`, loop prompt in ~/.pi/agent)
      started_at: 2026-10-30T12:40:00Z · ended_at: 2026-10-30T13:05:00Z · total: — · check: prettier clean · paths: packages/status/README.md, docs/status-architecture.md
- [x] tests: retirement assertions, legacy restore, local-load-probe expectations (2 tools, 6 commands)
      started_at: 2026-10-30T12:40:00Z · ended_at: 2026-10-30T13:05:00Z · total: — · check: 195/195 across suites · paths: packages/status/test/, test/local-load-probe.test.ts
- [x] feat(status): retire work_focus and stage instruments
      hash: 566bfbec7368630decb0f49cea80f89e74e93126

- [x] Human validation — response: VALID (Human reply: "VALID - commit and i'll push and publish") · outcome: change accepted; push and publish owned by the Human · surfaced: lint debt (eslint/biome need a real pnpm install), gate `accountingTools` + loop-prompt locksteps still open as follow-up briefs, ephemeral gitignored `node_modules` symlinks are local check scaffolding

  gate-attributed · tool: bash · paths: — · at 2026-10-30T12:26:02Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T12:26:09Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-10-30T12:26:57Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-10-30T12:27:07Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-10-30T12:27:27Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-10-30T12:27:39Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/test/local-load-probe.test.ts · at 2026-10-30T12:27:45Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T12:27:51Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-10-30T12:28:17Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T12:28:22Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-10-30T12:28:42Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T12:28:47Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T12:29:25Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-10-30T12:30:45Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-10-30T12:30:57Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-10-30T12:31:09Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-10-30T12:32:05Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-10-30T12:32:55Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-10-30T12:33:06Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-10-30T12:33:49Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T12:34:03Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-10-30T12:34:42Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-10-30T12:35:02Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-10-30T12:35:20Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-10-30T12:35:27Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T12:35:31Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-10-30T12:35:53Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-10-30T12:36:05Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-10-30T12:36:12Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-10-30T12:36:28Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-10-30T12:36:53Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/test/local-load-probe.test.ts · at 2026-10-30T12:37:02Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T12:37:07Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/README.md · at 2026-10-30T12:37:37Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/README.md · at 2026-10-30T12:38:05Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/README.md · at 2026-10-30T12:38:44Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T12:39:23Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T12:40:27Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T12:40:48Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/test/local-load-probe.test.ts · at 2026-10-30T12:42:08Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T12:42:12Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T12:42:37Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T13:22:16Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T13:22:21Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T13:22:27Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T13:22:32Z

  gate-attributed · tool: bash · paths: — · at 2026-10-30T13:23:17Z
