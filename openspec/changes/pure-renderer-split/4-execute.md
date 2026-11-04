# Execute

> Spec: pure-renderer-split · state legend: [ ] open · [x] done · ~ skipped

## Slice 1 — packages/work-state owns focus; status untouched

- [x] scaffold `packages/work-state/` (package.json, tsconfig.json cloned from status)
      paths: package.json · tsconfig.json
- [x] `index.ts`: verbatim `openspec_focus` tool block + `applyOpenSpecFocusAction` +
      `persistAndApplyFocus` + conflict guard (`tool_call`) with reworded message;
      `pi.events` `'focus-changed'` emitted after each successful write
      paths: index.ts
- [x] local copies in `src/focus.ts` (no cross-package runtime imports): entry constant, focus
      types + `NO_OPEN_SPEC_FOCUS`, `taskFocus`/`parseOpenSpecFocus`/`restoreOpenSpecFocus`/
      `sameTaskFocus`/`sameOpenSpecFocus`/`taskflowRunFocus`
      paths: src/focus.ts
- [x] tests: ported focus tests; contract test (byte-identical constant vs status); conflict-guard
      test; `focus-changed` emission test — 13/13 pass
      paths: test/focus.test.ts · test/tool.test.ts · test/contract.test.ts
- [x] `README.md`: owns focus entries; entry name = interface-not-ownership; lists
      `pi-openspec-gate`; no slash command
      paths: README.md
- [x] root `src/index.ts` registers `workState(pi)` before `galacticaStatus(pi)`; root
      `package.json` gains `test:work-state` + `test:components` inclusion
      paths: src/index.ts · package.json
- [x] verify: package checks (work-state, status), root format:check · lint · typecheck ·
      test:work-state · test:status · test:stardeck · check:package:load
      check: format clean · lint clean · typecheck green (root + workspaces) · tooling 24/24 ·
      status 175/175 · work-state 13/13 · stardeck 154/154 · composition PASS · package:load PASS
- [x] baseline: `check-baseline.mjs --write` → `check:baseline` green
      check: current 104 files PASS · imported record 87 files PASS
- [ ] commit `feat(work-state): own OpenSpec focus entries and taskflow conflict guard`
      hash:
- [ ] Human validation — response: · outcome: · surfaced:

Deviations recorded:
1. **The named duplicate-tool risk fired.** The load probe (modeling Pi's registry) rejects
   duplicate tool names — `duplicate tool registration: openspec_focus` the moment both packages
   registered it. The Plan's pre-agreed fallback executed: status's `openspec_focus` registerTool
   block (former L1348–1385) is deleted in Slice 1, and its five tool-path tests moved out —
   two deleted as byte-covered by work-state's suite, the retirement check flipped, and the two
   dual-harness tests trimmed to their `/openspec-focus` command paths. Slice 2 scope shrinks
   accordingly (status tool block already gone).
2. **`persistAndApplyFocus` verbatim rewrite** (planned above): status's version prefixed the
   write with a session-work clear via `runtime?.currentWorkFocus()` — retirement surface — so
   work-state's write path is append + local cache update + `focus-changed` emit.

Incident note: one deterministic-check round failed with `ENOSPC` on the devbox run dir —
the session tmpfs quota was consumed by node-compile-cache/jiti caches plus stale test-fixture
dirs. Caches cleared (regenerating by design); all affected checks rerun green. No code impact.

Planned-deviation note (from Plan's "verbatim"): status's `persistAndApplyFocus` prefixes the
focus write with a session-work clear (`runtime?.currentWorkFocus()` → `persistAndApplyWorkFocus`).
That block is session-work retirement surface (Slice 2 deletes it everywhere), so work-state's
write path is append + local cache update + `focus-changed` emit — no session-work reference.

## Slice 2 — status shrinks to pure renderer; session-work retires

- [x] status index.ts deletions (`title` tool block — the `openspec_focus` tool block was
      already removed by Slice 1's fold-in — auto-title, guard, appendEntry writers, setTitle,
      title/subject write paths); keep phase headers, defensive reads, three commands, feed
      check: zero appendEntry / registerTool / setTitle / lastTitle in production status
- [x] subscribe `'focus-changed'` → repaint; drop workFocus restore; band chip renders the
      `formatActiveWorkTitle` chain via the title-state `subject` slot; terminal titlebar
      never painted by this package (setTitle deleted)
      check: session_start/session_tree restore focus + legacy subject; subscriber parses
      defensively and repaints; harness captures band titles from header events
- [x] retire session-work + written subject: `active-work.ts`, `types.ts`, `reducer.ts`,
      `ledger.ts` (`focus/work` event gone), publisher widget/sources/branches + subject write
      path; tests pruned to rendering coverage — write-path tests moved to work-state or
      deleted; runtime zero-append assertion on the harness mock
- [x] `pi-stardeck`: `gauge.ts` drops `'session-work'` case; `deck.test.ts` updated; READMEs —
      status (pure renderer; entry names as read-interface), pi-stardeck (source union without
      session-work), docs/status-architecture.md selection ladder
- [x] verify: three package checks; `rg "session-work"` zero code references (README/doc
      history notes only); `rg "appendEntry|registerTool|setTitle" packages/status` zero
      production hits (test-harness API-shape mocks remain, with a runtime zero-append
      assertion)
      check: format clean · lint clean · typecheck green · tooling 24/24 · status 143/143 ·
      work-state 13/13 · stardeck 154/154 · composition PASS (5 commands, 1 tool) ·
      package:load PASS
- [x] baseline: `check-baseline.mjs --write` → `check:baseline` green
      check: current 104 files PASS · imported record 87 files PASS
- [x] commit `refactor(status): shrink to pure renderer; retire session-work`
      hash: 323e434 (amended to include the slice's 17 source/test/doc files; pushed)
- [ ] Human validation — response: · outcome: · surfaced:

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/work-state/package.json · at 2026-11-04T15:48:06Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/work-state/tsconfig.json · at 2026-11-04T15:48:06Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/work-state/index.ts · at 2026-11-04T15:48:06Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/work-state/test/focus.test.ts · at 2026-11-04T15:48:06Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/work-state/test/tool.test.ts · at 2026-11-04T15:48:06Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/work-state/test/contract.test.ts · at 2026-11-04T15:48:06Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/work-state/README.md · at 2026-11-04T15:48:06Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/src/index.ts · at 2026-11-04T15:48:16Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/package.json · at 2026-11-04T15:48:16Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:48:25Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:48:31Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/work-state/src/focus.ts · at 2026-11-04T15:49:40Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/work-state/test/tool.test.ts · at 2026-11-04T15:49:40Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:49:43Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:49:47Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:50:20Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:50:40Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:51:54Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:52:14Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-04T15:52:56Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:53:03Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:53:33Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-11-04T15:56:45Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/work-state/test/tool.test.ts · at 2026-11-04T15:56:45Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:56:52Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:57:14Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:57:35Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:58:04Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T15:58:18Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:02:20Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:10:23Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:11:01Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:11:23Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/active-work.ts · at 2026-11-04T16:25:26Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/types.ts · at 2026-11-04T16:25:26Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/ledger.ts · at 2026-11-04T16:25:26Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/gauge.ts · at 2026-11-04T16:25:26Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/reducer.ts · at 2026-11-04T16:25:49Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/publisher.ts · at 2026-11-04T16:25:49Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/publisher.ts · at 2026-11-04T16:26:23Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/publisher.ts · at 2026-11-04T16:26:54Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-04T16:28:38Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-04T16:30:02Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-04T16:30:41Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-04T16:31:36Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:31:43Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/active-work.ts · at 2026-11-04T16:32:47Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-04T16:32:47Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:32:51Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:34:12Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/reducer.test.ts · at 2026-11-04T16:36:49Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/parity.test.ts · at 2026-11-04T16:36:49Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/parity.test.ts · at 2026-11-04T16:37:10Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-11-04T16:37:10Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/publisher.test.ts · at 2026-11-04T16:37:35Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/publisher.test.ts · at 2026-11-04T16:38:16Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:38:51Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-11-04T16:39:58Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-11-04T16:40:18Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:41:17Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:41:47Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:43:28Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:44:51Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:45:01Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:45:47Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-11-04T16:46:36Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-11-04T16:46:36Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/parity.test.ts · at 2026-11-04T16:46:36Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:46:45Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:49:17Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:49:52Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:51:51Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:52:27Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:53:25Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:54:07Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:54:17Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:54:26Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-11-04T16:54:40Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:54:48Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-04T16:57:11Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-04T16:57:20Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-04T16:57:35Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-11-04T16:57:58Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:58:02Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/README.md · at 2026-11-04T16:58:25Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/README.md · at 2026-11-04T16:58:25Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:58:25Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T16:58:30Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-04T17:00:03Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T17:00:14Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T17:00:50Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T17:00:56Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-11-04T17:01:13Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T17:01:39Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T17:02:01Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T17:02:17Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T17:02:26Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T17:03:15Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T17:03:24Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/test/local-load-probe.test.ts · at 2026-11-04T17:03:46Z

  gate-attributed · tool: bash · paths: — · at 2026-11-04T17:03:54Z
