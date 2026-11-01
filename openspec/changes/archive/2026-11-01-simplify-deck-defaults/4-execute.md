# Execute

State legend: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.
A Slice = one conventional commit + one post-commit Human validation. Tasks are quick checkpoints inside a Slice.

## Slice 1 — A: restore Pi's default working indicator

- [x] delete `ctx.ui.setWorkingVisible(false)`; keep the TUI-guarded timer setup
- [x] README hide-working paragraph rewritten
- [x] Commit — fix(pi-stardeck): restore Pi's default working indicator
      hash: b636a3a

## Slice 2 — B: auto-set the session title from the first user prompt

- [x] `titleFromPrompt` helper + `before_agent_start` wiring (clear-only, slash-skip)
- [x] `title` tool description simplified; first-turn nag dropped
- [x] tests: auto-set, no-override, slash-skip, 120 bound, restore precedence
- [x] Commit — feat(status): auto-set session title from the first user prompt
      hash: e2136ff

## Slice 3 — C: pure activity band

- [x] `deck.ts` phase words, legacy labels, and `awaiting Human` deleted; five observed classes speak
- [x] band lifecycle = live observed activity only; turn cluster rides; seam rule follows
- [x] deck tests rewritten for the pure contract
- [x] Commit — feat(pi-stardeck): pure observed-activity band
      hash: 33e8733

## Slice 4 — D: task counts from the execution artifact

- [x] counts derive from parsed artifact tasks; CLI fallbacks preserve zero-guard
- [x] fixture tests: ticked artifact counts `d/N`; hierarchy + blocked-apply unchanged
- [x] Commit — fix(status): count openspec tasks from the execution artifact
      hash: e4b5fa9

## Slice 5 — strict refactor pass

- [x] legacy widget branch retired; surface narrows to `'deck' | 'editor-deck'`
- [x] 50 ms activity timer duty-cycled (ticks only while busy)
- [x] dead `deckMode` guards folded with proofs; embedder path intact
- [x] audit ledger recorded below; full suite green
- [x] Commit — refactor(pi-stardeck): retire dead surfaces and duty-cycle the activity timer
      hash: eddefbc

## Slice 6 — ledger close

- [x] `check:baseline --write` + rerun green
- [x] `check:openspec` — artifacts 4/4 complete (`isComplete: true`); strict
      delta validation stays structurally red while the change is active:
      the repo has no capability specs to delta against and `skip_specs` is
      restricted to ramona schemas (`scripts/check-openspec.mjs`), matching
      the documented predecessor behavior — it greens at archive
- [x] Human validation — response: "VALID" · outcome: change accepted; push,
      npm login, and `just publish 0.11.0` owned by the Human · surfaced:
      eslint/typescript-eslint offline debt stands; footer widget builders are
      the next retirement candidate; `check:openspec` greens at archive

## Audit ledger (inspected-but-kept)

Retired with proofs (zero production callers, zero test callers unless noted):
- `runtimeHeaderWork`, `lifecycleStatusLabel`, `displayedHeaderWork`, `IDLE_HEADER_WORK` (gauge.ts) — legacy-title-only helpers; their gauge.test assertions removed with them.
- The six non-deck publishers (`publishFooter`, `publishPromptStatus`, `publishRuntimeFooter`, `publishLatestResourceFooter`, `publishCapabilityFooter`, `removeFooterWidgets`) + `FANCY_FOOTER_READY_CHANNEL` listener + `deckMode`/`lastCapabilitySignature`/`lastActivityAgeSignature` state — every declared surface is a deck surface; the guards were always-true.
- The legacy widget render branch and `'legacy'` surface value — `ContextHeaderOptions.surface` is now `'deck' | 'editor-deck'`.
- `truncateToWidth` import (legacy render only).

Kept, with reasons:
- `packages/pi-stardeck/src/title.ts` layout functions — still exported and covered by `title.test.ts`; candidate for a separate retirement brief.
- Footer widget builders (`buildAgentFooterWidgets`, `buildRuntimeFooterWidgets`, `buildResourceFooterWidgets`, `buildCapabilityFooterWidget`) — exported protocol builders, unit-tested; production emit paths are gone, so they are the next debt candidate once the footer package's consumption is decided.
- `packages/pi-stardeck/src/title-state.ts` duplicate parser — deliberate protocol boundary (no cross-package npm dependency; event channel only).
- `spanTreeRows` stage words and the `titleBandLines` legacy selection branch — span-row contract and defensive render for pre-title publishers.
- eslint/biome via npm scripts — offline cache lacks typescript-eslint (pre-existing debt from 2026-10-30); biome check on `pi-vim-top-border` ran clean directly.

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/index.ts · at 2026-11-01T10:23:40Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/README.md · at 2026-11-01T10:23:40Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:23:47Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/active-work.ts · at 2026-11-01T10:26:18Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-01T10:26:29Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-11-01T10:26:48Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-11-01T10:27:01Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-11-01T10:27:09Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:27:09Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:27:19Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/deck.ts · at 2026-11-01T10:27:55Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:28:05Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:28:23Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:28:30Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:28:40Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:28:59Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-11-01T10:32:09Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-11-01T10:32:40Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/gauge.test.ts · at 2026-11-01T10:32:40Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-11-01T10:33:21Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:33:29Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:33:40Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:33:49Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-11-01T10:34:22Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:34:27Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:34:37Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/openspec.ts · at 2026-11-01T10:35:04Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/openspec.test.ts · at 2026-11-01T10:35:42Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:35:42Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:35:55Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/index.ts · at 2026-11-01T10:39:22Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/index.ts · at 2026-11-01T10:39:39Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/index.ts · at 2026-11-01T10:40:58Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/index.ts · at 2026-11-01T10:41:27Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/index.ts · at 2026-11-01T10:41:47Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/index.ts · at 2026-11-01T10:42:19Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/index.ts · at 2026-11-01T10:42:47Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/index.ts · at 2026-11-01T10:42:47Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/index.ts · at 2026-11-01T10:43:04Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/index.ts · at 2026-11-01T10:43:22Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/gauge.ts · at 2026-11-01T10:43:22Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/gauge.test.ts · at 2026-11-01T10:43:44Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/gauge.ts · at 2026-11-01T10:44:11Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:44:11Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:44:24Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:44:30Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:44:41Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/gauge.test.ts · at 2026-11-01T10:45:37Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:45:45Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:45:52Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:46:06Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:46:13Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:46:29Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:46:29Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:46:39Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:46:46Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:47:08Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:47:29Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:47:40Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:48:17Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:48:33Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:48:33Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:48:48Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:49:28Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:49:35Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:49:42Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:49:50Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:49:55Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:50:37Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:51:48Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/README.md · at 2026-11-01T10:52:22Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/README.md · at 2026-11-01T10:54:04Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:54:42Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/README.md · at 2026-11-01T10:55:39Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:55:53Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:56:05Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:56:16Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T16:39:53Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T16:40:17Z
