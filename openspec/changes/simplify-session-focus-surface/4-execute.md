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
      hash: pending — commit follows this ledger write

- [ ] Human validation — response: · outcome: · surfaced:

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
