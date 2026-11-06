# Execute

> Spec: redesign-deck-title-band · state legend: [ ] open · [x] done · ~ skipped

## Slice 1 — collector: file-truth artifacts, honest absence

- [x] `packages/status/src/types.ts`: retire `ladder`; add `OpenSpecArtifact`
      `{ id, done, items? }`, `artifacts?`, `currentArtifact?`,
      `changeModifiedAt?`
      started_at: 2026-11-06T10:24Z · ended_at: 2026-11-06T10:30Z · total: 5 edits ·
      check: root tsc clean after full source pass
      paths: packages/status/src/types.ts
- [x] `packages/status/src/openspec.ts`: `parseCheckboxCounts` (undefined at
      zero checkboxes), `readArtifactItems` mtime-keyed cache, rebuilt
      `parseOpenSpecStatus` (artifacts + `currentArtifact` = first not-done,
      last-done fallback), `changeDirectoryMtime`, per-artifact file-truth
      items; no invented-zero fallbacks on the artifact path
      started_at: 2026-11-06T10:30Z · ended_at: 2026-11-06T10:36Z · total: 7 edits ·
      check: `resolvedOutputPath` stays internal — never emitted on the contract
      paths: packages/status/src/openspec.ts
- [x] tests: artifacts/currentArtifact + per-artifact items from real tmp
      files; unreadable/empty → no counts; `parseCheckboxCounts` zero-as-
      absence; mtime cache hit/miss + unreadable retry; changeModifiedAt
      equality; currentArtifact first-not-done and all-done fallback
      started_at: 2026-11-06T10:36Z · ended_at: 2026-11-06T10:44Z · total: 5 tests ·
      check: status suite 148/148; fixtures later re-anchored to the real
      status shape (changeRoot + relative outputPath — deviation 5)
      paths: packages/status/test/openspec.test.ts

## Slice 2 — contract v2 + attention composition

- [x] `packages/status/src/title-state.ts`: v2 (`TITLE_STATE_VERSION = 2`),
      `TitleArtifactState`, work slot = change/task/schemaName/artifacts/
      currentArtifact/awaitingValidation/focusAt/focusStale; defensive
      parser bounds artifacts (≤16, boolean `done`, item pair ≤999), safe-
      integer `focusAt`, truthy-only flags; retired `done`/`total`/`ladder`
      and `boundedCount` — no zero fabrication remains
      started_at: 2026-11-06T10:36Z · ended_at: 2026-11-06T10:40Z ·
      check: builder output round-trips through the parser
      paths: packages/status/src/title-state.ts
- [x] `packages/status/src/title-state.ts`: `deriveTitleWork` rebuilt —
      artifact facts only, attention derived (`focusStale =
      changeModifiedAt > focusAt`, awaitingValidation passthrough), passive
      work carries no attention facts
      paths: packages/status/src/title-state.ts
- [x] `packages/status/src/active-work.ts`: `π • ` prefix removed — subject
      renders bare (pi-title's naming quoted, never re-decorated)
      paths: packages/status/src/active-work.ts
- [x] `packages/status/index.ts`: `focusAt` tracked at seed + `setFocus`,
      passed into `buildTitleState`
      paths: packages/status/index.ts
- [x] tests: title-state v2 rewrite (16 parser/builder/derivation tests);
      publisher v2 expectations; active-work 22 prefix expectations updated
      started_at: 2026-11-06T10:44Z · ended_at: 2026-11-06T10:48Z ·
      check: status suite 148/148
      paths: packages/status/test/title-state.test.ts ·
      packages/status/test/publisher.test.ts ·
      packages/status/test/active-work.test.ts

## Slice 3 — renderer: tile, attention, width

- [x] `packages/pi-stardeck/src/title-state.ts`: v2 mirror (`DECK_TITLE_
      STATE_VERSION = 2`), parser parity, `deckWorkSegments(work, now?,
      compact?)` — `⏸ awaiting you` (warning) replaces everything; stale
      `⚠ focus <age> old` (dim, humanized at render via exported
      `compactActivityAge`) replaces the artifact group; `execute 4/4 ›
      󰄱 12/15`; success only when artifacts AND current items settle; items
      hidden when unknown — never zeros; compact yields attention/progress
      first, items survive
      started_at: 2026-11-06T10:48Z · ended_at: 2026-11-06T10:50Z ·
      paths: packages/pi-stardeck/src/title-state.ts ·
      packages/pi-stardeck/src/activity-age.ts
- [x] `packages/pi-stardeck/src/deck.ts`: `workTile(state, theme, width)` —
      ≥56 full · 40–55 items-only · <40 none; `— no change owns the moment`
      hint retired (sentinel narration; duplicate chrome beside a pi-title
      session name)
      paths: packages/pi-stardeck/src/deck.ts
- [x] tests: all five acceptance frames asserted (focused/awaiting/no-focus/
      unreadable/stale), width stages 120/45/39, stale humanized age with a
      fixed clock, compact yielding, retired-v1-key normalization, parser
      rejection shapes; deck fixtures to v2 (IDLE_TITLE/WORK_TITLE),
      mockups updated, hint assertions retired
      started_at: 2026-11-06T10:50Z · ended_at: 2026-11-06T10:52Z ·
      check: stardeck suite 162/162
      paths: packages/pi-stardeck/test/title-state.test.ts ·
      packages/pi-stardeck/test/deck.test.ts

## Slice 4 — verification + baseline

- [x] focused suites: `test:status` 148/148 · `test:stardeck` 162/162 ·
      `test:components` all green (work-state 13, footer 28, vim 37) ·
      `test:tooling` 24/24
      started_at: 2026-11-06T10:52Z · ended_at: 2026-11-06T10:54Z ·
      check: pass
- [x] `format` (prettier, all files unchanged) · `lint` (biome + eslint
      clean) · `typecheck` (root + workspaces green)
      check: pass
- [x] baseline: `node scripts/check-baseline.mjs --write` →
      `npm run check:baseline` green (current 104 files PASS, imported
      record 87 files PASS)
      check: pass
- [x] `check:package:load` + `check:composition` PASS
      check: pass
- [~] `check:openspec`: red only on the pre-existing
      `data-driven-skip-specs` gap (documented expected in
      pure-renderer-split's verification notes); this change's ledger now
      complete; invalid scaffolded `skip_specs: true` removed from this
      change's `.openspec.yaml`
      check: known red, not introduced by this change
- [x] commit `feat(deck): truthful de-duplicated title band`
      hash: b5e15cc
- [x] Human validation — response: "VALID !" (chat, 2026-11-06) · outcome:
      pass · surfaced: the live frame test caught the missing item segment
      (deviation 5, status-JSON shape), fixed and re-verified before the
      verdict

Deviations recorded:
1. **`currentArtifact` semantics corrected, not just renamed** (Plan choice
   4, Human-reflected): first not-yet-done artifact (live evidence:
   `execute: "ready"` at 3/4), last-done fallback once everything is
   complete. The old `rung` named the last DONE artifact mid-flight.
2. **The dim no-work hint retired** (Plan choice 5, Human-reflected
   pi-title pass): `work === null` renders an empty tile; two deck tests and
   one comment retired with it.
3. **One-hue refinement**: the artifact group turns success only when the
   artifacts are done AND the current artifact's items are settled —
   `execute 4/4 › 󰄱 12/15` stays accent (work still open), `execute 4/4`
   alone at full completion goes success.
4. **`skip_specs: true` removed** from this change's `.openspec.yaml` — the
   scaffold emitted it; the repo check forbids it for the `spec` schema.
5. **Item paths resolved from `outputPath` + `changeRoot`** (live-session
   catch, Human frame test): the plan assumed the artifacts array carries
   `resolvedOutputPath`, but the live `openspec status --json` only has it
   in the top-level `artifactPaths` map — the array entries carry a
   RELATIVE `outputPath` plus a top-level `changeRoot`. The collector now
   resolves and containment-checks the path itself. Symptom was `execute
   4/4` without the item segment in the first live test; fixed and verified
   against the real CLI (`execute … items {done:15,total:17}`).

  gate-attributed · tool: bash · paths: — · at 2026-11-06T10:51:41Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T10:51:50Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T10:52:02Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:24:55Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:25:05Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/openspec.ts · at 2026-11-06T11:25:39Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/openspec.test.ts · at 2026-11-06T11:25:50Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:25:55Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:26:08Z

  gate-attributed · tool: write · paths: /tmp/deck-retest/probe.ts · at 2026-11-06T11:29:51Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:29:55Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:29:59Z

  gate-attributed · tool: edit · paths: /tmp/deck-retest/probe.mts · at 2026-11-06T11:30:10Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:30:15Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:31:25Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:31:32Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:31:37Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:31:42Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:31:50Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:32:10Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:32:19Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:32:26Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:32:31Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:32:48Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:32:52Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:32:59Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:33:14Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:38:38Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:38:52Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:38:57Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:39:13Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:39:24Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:53:40Z

  gate-attributed · tool: bash · paths: — · at 2026-11-06T11:53:52Z
