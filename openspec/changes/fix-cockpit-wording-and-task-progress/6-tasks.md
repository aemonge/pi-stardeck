# Tasks

State legend: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.
A Slice = one conventional commit + one post-commit Human validation. Tasks are quick checkpoints inside a Slice.

## Slice 1 — honest counts at the print boundary

> Spec: fix-cockpit-wording-and-task-progress

- [x] Task 1 — zero-guard apply-progress in `packages/status/src/openspec.ts`
      (use it only when total > 0 / not `blocked`; `list` counts otherwise)
      with unit tests covering the blocked-apply case
      started_at: 2026-10-23T09:35:25Z · ended_at: 2026-10-23T09:41:55Z · total: 7m · check: npm run test:status — 167 pass, 0 fail
      paths: packages/status/src/openspec.ts · packages/status/test/openspec.test.ts
- [x] Task 2 — remove the fabricated `{done: 0, total: 0}` default at
      `packages/status/src/title-state.ts:189`; real change-level counts or
      the dim hint, with tests for both branches
      started_at: 2026-10-23T09:35:25Z · ended_at: 2026-10-23T09:41:55Z · total: 7m · check: npm run test:stardeck — 152 pass, 0 fail; typecheck green
      paths: packages/status/src/title-state.ts · packages/status/test/title-state.test.ts · packages/pi-stardeck/src/title-state.ts · packages/pi-stardeck/src/deck.ts · packages/pi-stardeck/test/title-state.test.ts
- [x] Task 3 — focused checks: `npm run test:status`, `tsc --noEmit`,
      lint, format check
      started_at: 2026-10-23T09:35:25Z · ended_at: 2026-10-23T09:41:55Z · total: 7m · check: all green; baseline manifest refreshed — 96 files PASS
      paths: baseline/source.sha256
- [x] Commit — fix(status): let list counts win over blocked apply zeros
      message: fix(status): let list counts win over blocked apply zeros
      hash: dfd4959
- [x] Human validation — with the 4/7 fixture focused, the Work tile prints
      `4/7`, not `0/0` (Human Validation Process, refined Requirements)
      response: ":) VALID" · outcome: VALID · at: 2026-10-23T10:20:09Z
      surfaced: Work label wants richer info — `[spec] planning 6/7 · tasks 4/14` — routed to follow-up Slice 4

## Slice 2 — Spec-level focus tracking

> Spec: fix-cockpit-wording-and-task-progress

- [ ] Task 1 — `packages/status/index.ts:1205`: `set` accepts change-only
      focus (task optional); status/replace/clear follow the same shape
      started_at: n/a · ended_at: n/a · total: n/a · check: n/a
      paths: n/a
- [ ] Task 2 — `deriveTitleWork` change-mode tracks the focused change from
      rung 1; `workTile` prints title + dim no-ledger marker until
      `6-tasks.md` exists, honest counts after
      started_at: n/a · ended_at: n/a · total: n/a · check: n/a
      paths: n/a
- [ ] Task 3 — orchestration/publisher plumbing for the change-mode fact,
      plus tests
      started_at: n/a · ended_at: n/a · total: n/a · check: n/a
      paths: n/a
- [ ] Commit — feat(status): change-only focus tracks the Spec from rung one
      message: feat(status): change-only focus tracks the Spec from rung one
      hash: n/a
- [ ] Human validation — a change-only focus set on this Spec mid-ladder
      tracks in the tile: title + dim no-ledger marker
      response: n/a · outcome: n/a · at: n/a
      surfaced:

## Slice 3 — agent-facing wording

> Spec: fix-cockpit-wording-and-task-progress

- [ ] Task 1 — `AGENTS.md` lines 8 and 37 speak deck wording; lines 73 and
      137 stay byte-identical (historical identifiers)
      started_at: n/a · ended_at: n/a · total: n/a · check: n/a
      paths: n/a
- [ ] Task 2 — `src/health.ts` WARN string speaks deck wording; test
      expectation updated in the same commit
      started_at: n/a · ended_at: n/a · total: n/a · check: n/a
      paths: n/a
- [ ] Commit — docs(agents): retire cockpit wording from agent-injected surfaces
      message: docs(agents): retire cockpit wording from agent-injected surfaces
      hash: n/a
- [ ] Human validation — a fresh agent session (or grep) receives no
      cockpit metaphor
      response: n/a · outcome: n/a · at: n/a
      surfaced:

## Slice 4 — rich Work label: schema, phase, ladder, and task counts

> Spec: fix-cockpit-wording-and-task-progress

- [x] Task 1 — collector fetches `openspec status --change <id> --json`
      (fail-soft) for schemaName + artifact ladder counts
      started_at: 2026-10-23T10:20:09Z · ended_at: 2026-10-23T10:27:58Z · total: 8m · check: npm run test:status — 169 pass, 0 fail
      paths: packages/status/src/openspec.ts · packages/status/src/types.ts · packages/status/test/openspec.test.ts
- [x] Task 2 — work state carries schemaName + ladder through derive and
      both parsers (paired presence); phase word derived
      started_at: 2026-10-23T10:20:09Z · ended_at: 2026-10-23T10:27:58Z · total: 8m · check: phase cases — planning/executing/complete green
      paths: packages/status/src/title-state.ts · packages/status/test/title-state.test.ts
- [x] Task 3 — segment-based workTile rendering (per-segment colors, 󰄱 glyph)
      + plain label join; tests for segments, degradation, phase
      started_at: 2026-10-23T10:20:09Z · ended_at: 2026-10-23T10:27:58Z · total: 8m · check: npm run test:stardeck — 153 pass, 0 fail; typecheck 0 errors
      paths: packages/pi-stardeck/src/title-state.ts · packages/pi-stardeck/src/deck.ts · packages/pi-stardeck/test/title-state.test.ts · packages/pi-stardeck/test/deck.test.ts
- [x] Commit — feat(status): rich work label — schema tag, phase, ladder, tasks
      message: feat(status): rich work label — schema tag, phase, ladder, tasks
      hash: 76c0ff8
- [ ] Human validation — the footer prints
      `[spec] fix-cockpit-wording-and-task-progress ⟩ planning 6/7 › 󰄱 9/19`
      response: n/a · outcome: n/a · at: n/a
      surfaced: rainbow reduction steering — V3 layout × V6 state colors,
      [spec] tag removed — routed to Slice 5

## Slice 5 — Work tile final design: V3 layout × V6 state colors

> Spec: fix-cockpit-wording-and-task-progress

- [x] Task 1 — deckWorkSegments retooled: tag removed, ladder-led phase
      group, state colors, bold flag, filled marker at complete
      started_at: ~2026-10-23T10:40Z · ended_at: 2026-10-23T11:07:32Z · total: 27m · check: npm run test:stardeck — 153 pass, 0 fail
      paths: packages/pi-stardeck/src/title-state.ts · packages/pi-stardeck/src/deck.ts
- [x] Task 2 — tests updated: plain format per state, segment palette per
      state, degradation, deck color assertions
      started_at: ~2026-10-23T10:40Z · ended_at: 2026-10-23T11:07:32Z · total: 27m · check: typecheck 0 errors; lint green; prettier applied
      paths: packages/pi-stardeck/test/title-state.test.ts · packages/pi-stardeck/test/deck.test.ts
- [ ] Commit — feat(status): retool work tile — ladder-led layout, state colors
      message: feat(status): retool work tile — ladder-led layout, state colors
      hash: n/a
- [ ] Human validation — the footer prints
      `fix-cockpit-wording-and-task-progress ⟩ 6/7 planning › 󰄱 12/23`
      response: n/a · outcome: n/a · at: n/a
      surfaced:
