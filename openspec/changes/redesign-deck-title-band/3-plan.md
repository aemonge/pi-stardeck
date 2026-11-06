# Plan

> Spec: redesign-deck-title-band · consult `openspec/learnings/estimation.md` and `skills.md` (absent — bare)

## Estimate

2–3 h · high confidence (0.85) — the Human-approved brief (2026-11-06) fixed
every shape decision; discovery verified all CLI/file assumptions against the
live tree. Risk is confined to the contract-v2 round-trip and the two-stage
width seam, both covered by deterministic tests.

## Skills

`bare — no catalog skill matches TypeScript Pi-extension work; conventions live in-repo (AGENTS.md, current Pi docs under /usr/lib/pi/docs, defensive-boundary doctrine)`

## Workflow

Direct — the confirmed brief fixed the route; investigation confirmed the
facts. Committed choices:

1. **Contract v2 bump** (`TITLE_STATE_VERSION`/`DECK_TITLE_STATE_VERSION`
   1→2): `work` drops `done`/`total`/`ladder`, gains `artifacts?: {id, done,
   items?}[]`, `currentArtifact?`, `awaitingValidation?`, `focusAt?`,
   `focusStale?`. Cross-version events degrade to legacy rendering by the
   existing version reject.
2. **Items from file truth**: `parseCheckboxCounts(content)` →
   `{done, total} | undefined` (undefined at zero checkboxes — absence, never
   0); per-artifact file reads cached by `path + stat.mtimeMs`; unreadable →
   `undefined` uncached. The tile's item segment uses `currentArtifact`'s
   counts only.
3. **Staleness composition**: collector exports `changeModifiedAt` (max mtime
   over the change dir's direct files, traversal-guarded); publisher tracks
   `focusAt` (seed + `setFocus`); `buildTitleState` derives `focusStale =
   task focus && changeModifiedAt > focusAt`. Restored sessions re-seed
   `focusAt` — staleness honestly covers only post-(re)focus events.
4. **`currentArtifact` semantics corrected, not just renamed**: first
   artifact whose status is not `done` (the one you are in — live evidence:
   `execute: "ready"` at 3/4), falling back to the last done artifact when
   everything is complete. Identical to the old `rung` in the all-done
   acceptance frame (`execute 4/4`).
5. **Tile priority**: `⏸ awaiting you` (warning) replaces everything; stale
   `⚠ focus <age> old` (dim, humanized at render) replaces the artifact
   group; else `execute 4/4` (success when all artifacts done); items
   `› 󰄱 12/15` (✔ bold success at complete) hidden when unknown. Change name
   dropped — subject already names it. The `— no change owns the moment`
   hint retires: sentinel narration forbidden by the repo's own doctrine,
   and duplicate chrome beside a pi-title session name (no-focus frame shows
   the name alone); two deck tests + one comment retire with it.
6. **Width policy**: full tile ≥ 56; 40–55 attention/progress yield, items
   survive; < 40 no tile (existing floor).
7. **Subject**: `formatActiveWorkTitle` drops the `π • ` prefix; task-title
   append stays as-is. pi-title seam untouched: naming chain, repaint
   triggers, terminal-titlebar policy, zero entry writes, frozen reducer
   projection (zero consumers) untouched.
8. **Untouched**: `galactica-status.openspec-focus.v1`, work-state payloads,
   footer telemetry fields, no new dependencies, no other packages.

## Slices

### Slice 1 — collector: file-truth artifacts, honest absence

- [ ] `packages/status/src/types.ts`: retire `ladder`; add
      `OpenSpecArtifact { id, done, items? }`, `artifacts?`, `currentArtifact?`,
      `changeModifiedAt?`
- [ ] `packages/status/src/openspec.ts`: `parseCheckboxCounts` (undefined at
      zero checkboxes); mtime-keyed item cache; `parseOpenSpecStatus` emits
      `artifacts`/`currentArtifact` (rung logic renamed, per-artifact items
      from resolved files); `collectOpenSpec` stats the change dir for
      `changeModifiedAt`; every invented-zero fallback removed
- [ ] tests (`openspec.test.ts`): checkbox counting (file truth, cache hit via
      mtime, unreadable → undefined), artifacts/currentArtifact parsing,
      changeModifiedAt containment guard, undefined-vs-zero in every parser

### Slice 2 — contract v2 + attention composition

- [ ] `packages/status/src/title-state.ts`: v2 types + defensive parser
      (`artifacts`/`currentArtifact`/`awaitingValidation`/`focusAt`/
      `focusStale`), `deriveTitleWork` rebuilt on facts-only extras,
      `buildTitleState` derives `focusStale` from `focusAt` +
      `changeModifiedAt`
- [ ] `packages/status/src/active-work.ts`: drop the `π • ` prefix in
      `formatActiveWorkTitle`
- [ ] `packages/status/index.ts`: track `focusAt` (seed + `setFocus`), pass it
      into `buildTitleState`
- [ ] tests: title-state v2 round-trip, focusStale derivation, subject without
      prefix; update publisher/active-work suites

### Slice 3 — renderer: tile, attention, width

- [ ] `packages/pi-stardeck/src/title-state.ts`: v2 types + parser mirror;
      `deckWorkSegments(work, now?)` — awaiting-you replacement, stale
      attention, artifact group, items segment, honest absence everywhere
- [ ] `packages/pi-stardeck/src/activity-age.ts`: export the compact age
      humanizer for the stale segment
- [ ] `packages/pi-stardeck/src/deck.ts`: width policy (≥ 56 full · 40–55
      items-only · < 40 none); drop change name from the tile path
- [ ] tests: all five acceptance frames (focused/awaiting/no-focus/unreadable/
      stale), width stages, parser rejection shapes

### Slice 4 — verification + baseline

- [ ] focused suites: `test:status`, `test:stardeck`; root `format:check` ·
      `lint` · `typecheck` · `test:tooling` · `check:composition` ·
      `check:package:load`
- [ ] baseline: `node scripts/check-baseline.mjs --write` →
      `npm run check:baseline` green
- [ ] commit `feat(deck): truthful de-duplicated title band` (waits for Human
      validation) · validation: the live acceptance frames below

## Verification

Deterministic: the four Slices' verify lines — root `npm run check` gates
(baseline, package:load, format, lint, typecheck, tooling + component tests),
with the five acceptance frames asserted as unit tests: focused-working
(`execute 4/4 › 󰄱 12/15`), awaiting (`⏸ awaiting you`), no-focus (empty tile,
session-name subject), unreadable items (`execute 4/4`), stale
(`⚠ focus 3h old › 󰄱 12/15`). Contract guard: `galactica-status.openspec-focus.v1`
constant and work-state payloads byte-identical (existing contract test stays
green untouched). The one human-only act: live pi session — line 2 shows
subject without `π • `, no duplicated change name, no `0/0` under
`redesign-deck-title-band` itself (whose execute.md carries real checkboxes),
stale/awaiting frames on a naturally aged focus.

## History

- 2026-11-06 — drafted after granted brainstorm/investigate; integrates the
  investigate confirmations (CLI cannot count custom-schema items; checkbox
  format holds; contract is repo-internal so v2 rides a version bump); no
  deviations yet.
- 2026-11-06 — second investigate pass (Human-directed pi-title reflection)
  amended choices 4–5, 7: `currentArtifact` = first not-done (live
  `execute: "ready"` evidence), the dim no-work hint retires per the
  no-focus frame + reducer doctrine, pi-title keep/change boundary recorded.
