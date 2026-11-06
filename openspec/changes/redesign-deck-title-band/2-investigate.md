# Investigate

> Spec: redesign-deck-title-band · aim at the Brainstorm's Questions

## Findings

**The `0/0` mechanism, confirmed at both CLI sources.** `openspec list --json`
reports for all three local changes: `completedTasks: 0, totalTasks: 0,
status: "no-tasks"`. `openspec instructions apply --change pure-renderer-split
--json` reports `tasks: []`, `progress: {total: 0, complete: 0, remaining: 0}`,
`taskTrackingConfigured: false`, `state: "ready"`. Neither CLI can count
custom-schema items — file truth is the only source. Today that flows through
`deriveTitleWork`'s `counts()` (`boundedCount(hierarchy?, completedTasks)`
fallbacks) into `work.done/total`, and `deckWorkSegments` renders `󰄱 0/0`.

**Checkbox format holds.** `pure-renderer-split/4-execute.md` carries
`- [x]` / `- [ ]` at line start (15 done / 18 total). The `~ skipped` legend
is prose only; no `- [~]` items exist in any local execute file. The existing
`[ xX]` pattern counts truthfully.

**`openspec status --json` shape.** `artifacts` is
`{ id, outputPath, resolvedOutputPath, status: "done" | …, requires }[]` —
lifecycle only, no item counts. The current `rung` pick (last `done` artifact
id, else first id) maps 1:1 onto `currentArtifact`.

**Contract consumers are repo-internal.** The `deck-title-state` v1 object is
published on `GALACTICA_HEADER_CHANNEL` (`title` field) and parsed only by
`packages/pi-stardeck/src/gauge.ts` (`parseDeckTitleState`). Both sides ship
in this repo, so the shape change rides a version bump to v2; the defensive
parsers reject unknown versions and fall back to legacy rendering.

**Focus timestamps exist at the publisher seam.** `setFocus` and the seed
constructor already record `at: Date.now()` on `focus/openspec` ledger events;
the publisher tracks `this.focus` but no timestamp. Staleness compares that
timestamp against the change directory's max file mtime — the collector is the
only component with `projectRoot` + fs access, so it exports
`changeModifiedAt` and the publisher composes `focusStale`.

**`π • ` prefix sites.** The deck's line-2 subject comes from
`formatActiveWorkTitle` (`active-work.ts`, `` `π • ${detail}` ``). The
reducer's legacy `π ${detail}` projection (no bullet) feeds only the
pre-title publisher selection path, whose deck rendering joins bare titles —
no chrome reaches line 2 from there. Only `formatActiveWorkTitle` changes.

**Width seam.** `renderHeaderDeck` gates the whole tile at `boundedWidth >= 40`
and `workTile` renders all segments unconditionally. The two-stage policy
(full ≥ 56, items-only 40–55, none < 40) fits the existing seam without
touching `alignedSingleRow`.

**Untouched surfaces verified.** `OpenSpecState.completedTasks/totalTasks`
still feed the footer progress icon and counters (below-deck telemetry, out
of scope). `galactica-status.openspec-focus.v1` and every work-state payload
stay byte-identical. No new dependencies.

## pi-title keep/change reflection (Human-directed, second pass)

**Keep — the naming seam is already correct and stays untouched.**
pi-title owns the terminal titlebar and native session naming; status only
listens: `session_start` seeds `sessionName` via `pi.getSessionName() ??
ctx.sessionManager.getSessionName()` (index.ts L1008), `session_info_changed`
updates it (L894/L1020), and `formatActiveWorkTitle` prefers it in the
fallback chain (task focus → session name → legacy subject → dir → `pi`).
The `currentTitleState` comment is load-bearing policy: the terminal titlebar
is pi-title's alone; this package never paints it. Zero `appendEntry` calls
remain in status src (the only hit is a test-harness mock) — status writes no
session entries, so the frozen entry contracts cannot drift from this change.
No cross-repo touch: pi-title, pi-openspec-gate, work-state all unreached.

**Change — text only, inside the chip.** The subject chip drops the `π • `
prefix, so pi-title's session name renders bare (`Kernel upload error
paths`, exactly the no-focus acceptance frame). The focused-task detail also
renders bare (`change › 8-1 Validate oversized uploads`). Colors, mirror
coloring, and repaint triggers are unchanged.

**Resolved by this lens — the dim hint must go.** `workTile` currently
renders `— no change owns the moment` whenever a title exists without work.
The no-focus acceptance frame shows the pi-title session name alone on line 2
— and the hint is literally a sentinel dash plus narration, which the repo's
own reducer doctrine forbids ("absent facts produce absent slots, never
sentinel dashes or narration"). With pi-title naming the session, the hint
would also be duplicate chrome beside a real name. Decision: `work === null`
renders an empty tile; two deck tests and one comment asserting the hint are
retired with it.

**Resolved — the reducer's legacy `π` projection stays.** The reducer's
frozen title projection (`π ${detail}`, no bullet) feeds `cockpitSnapshot()`,
which has zero consumers in the repo — a debug-only derived projection. It
renders on no user surface; touching the frozen reducer contract for a
surface nobody reads is out of scope. Only `formatActiveWorkTitle` changes.

**New live evidence — partial artifacts.** This change's own `openspec
status --json` shows the mid-flight shape: `plan: "done"`,
`execute: "ready"`. The old `rung` pick (last `done`) would name `plan` at
3/4 while the actual work is in `execute`. `currentArtifact` therefore means
the first artifact whose status is not `done`, falling back to the last done
artifact when everything is complete (the all-done acceptance frame `execute
4/4` is identical under both rules). This renames AND corrects the semantics
— flagged for Human eyes in the Plan.

**Collision seam.** `alignedSingleRow` truncates the subject (with `…`) and
never truncates the tile — the tile either fits or owns the row. The
three-stage width policy therefore lives entirely in the existing
`renderHeaderDeck` gate; no new layout machinery.

**Staleness surface.** Change dirs are flat (only `archive/` nests, which is
a different change), so max-mtime over direct files is sufficient. Note:
`.openspec.yaml` mtime moves on gate grants (Human-side actions) — file
truth, acceptable. Restored sessions re-seed `focusAt` at restore time; the
frozen entry payload carries no original timestamp, so staleness honestly
measures only events after (re)focus in a live session — documented
limitation, not silently widened.

**Test surface sized.** Publisher tests assert the v1 shape at two sites
(publisher.test.ts L728–760); the hint asserts at three deck sites;
`formatActiveWorkTitle` prefix asserts at eight active-work sites; both
title-state suites (~644 lines) round-trip v1 constants. All counted in the
Plan's slices.
