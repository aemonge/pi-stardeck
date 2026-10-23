# Plan

## Estimate

4–7 focused hours across three Slices · high confidence — all three defect
mechanisms were spike-verified on 2026-10-23; remaining risk is UI polish, not
discovery.

## Skills

- Pi extension API authority: `/usr/lib/pi/docs` (`packages.md`,
  `extensions.md`, `tui.md`) — per `AGENTS.md` Development.
- The frozen status contract: `docs/status-architecture.md` (derived-only
  rule, fail-soft boundaries) — the print chain must not violate it.
- `packages/status/test/openspec.test.ts` fixture conventions for parser and
  collection tests.

## Workflow

A1 — CLI-authoritative: the CLI already counts the `spec`-schema ledger
honestly (spike evidence: `list` → `4/7`, `in-progress`); the lie is
`collectOpenSpec` preferring `instructions apply`'s blocked-state
`progress: {total: 0, complete: 0}` over list's counts — a precedence bug, not
a counting bug. A2 (ledger-native parsing) lost: it duplicates a working
counter and inherits format drift for nothing. A3 (hybrid override) lost: its
override case cannot occur once precedence is fixed — list is honest, apply's
zeros were the only liar.

## Slices

### Slice 1 — honest counts at the print boundary

Planned commit: `fix(status): let list counts win over blocked apply zeros`

- [ ] Task 1 — `packages/status/src/openspec.ts`: use apply-progress only when
      usable (total > 0 / state not `blocked`); otherwise the `list` counts
      stand. Unit tests cover the blocked-apply case.
- [ ] Task 2 — `packages/status/src/title-state.ts:189`: task-mode focus
      without a matching snapshot prints real change-level counts or the dim
      hint — never `{done: 0, total: 0}`. Tests for both branches.
- [ ] Task 3 — focused checks: `npm run test:status`, `tsc --noEmit`, lint,
      format check.
- [ ] Human validation — with the 4/7 fixture focused, the Work tile prints
      `4/7`, not `0/0`.

### Slice 2 — Spec-level focus tracking

Planned commit: `feat(status): change-only focus tracks the Spec from rung one`

- [ ] Task 1 — `packages/status/index.ts:1205`: `set` accepts change-only
      focus (task optional); status/replace/clear follow.
- [ ] Task 2 — `deriveTitleWork` change-mode: track the focused change from
      rung 1; `workTile` prints the title with a dim no-ledger marker until
      `6-tasks.md` exists; honest counts the moment it does.
- [ ] Task 3 — orchestration/publisher plumbing for the change-mode fact,
      plus tests.
- [ ] Human validation — a change-only focus set on this Spec mid-ladder
      tracks in the tile: title + dim no-ledger marker.

### Slice 3 — agent-facing wording

Planned commit: `docs(agents): retire cockpit wording from agent-injected surfaces`

- [ ] Task 1 — `AGENTS.md` lines 8 and 37 speak deck wording; lines 73 and 137
      stay byte-identical (historical identifiers).
- [ ] Task 2 — `src/health.ts` WARN string speaks deck wording; its test
      expectation updated in the same commit.
- [ ] Human validation — a fresh agent session (or grep) receives no cockpit
      metaphor.

### Slice 4 — rich Work label: schema, phase, ladder, and task counts (follow-up)

Human steering surfaced at Slice 1 validation (2026-10-23): the Work tile
shows the full Spec story —
`[spec] <change> ⟩ <phase> <ladder-done>/<ladder-total> › 󰄱 <tasks-done>/<tasks-total>`
with per-segment colors (schema dim · change accent · phase success · ladder
thinkingHigh · tasks warning with the empty-checkbox glyph). Degradation:
unknown counts omit their segments; the bare change is the honest floor.
Phase word: ladder incomplete → planning; ladder complete with tasks open →
executing; all complete → complete. Estimate delta: +1–2h.

- [ ] Task 1 — collector fetches `openspec status --change <id> --json`
      (fail-soft) for schemaName + artifact ladder counts
- [ ] Task 2 — work state carries schemaName + ladder through derive and both
      parsers (paired presence); phase word derived
- [ ] Task 3 — segment-based workTile rendering (per-segment colors, 󰄱 glyph)
      + plain label join; tests for segments, degradation, phase
- [ ] Commit — feat(status): rich work label — schema tag, phase, ladder, tasks
- [ ] Human validation — the footer prints
      `[spec] fix-cockpit-wording-and-task-progress ⟩ planning 6/7 › 󰄱 4/14`

### Slice 5 — Work tile final design: V3 layout × V6 state colors (follow-up)

Human steering at Slice-4 review (2026-10-23): the `[spec]` tag is removed
entirely; layout V3 — `change ⟩ 6/7 phase › 󰄱 done/total` (ladder leads the
phase word); colors V6 — one hue per state: accent throughout while
planning, the `6/7 executing` group greens at executing, the whole tile
turns success at complete with the checkbox filled (`✔`) and bold counts.
Degradation floor: the bare change. Estimate delta: +45m.

- [ ] Task 1 — deckWorkSegments retooled: tag removed, ladder-led phase
      group, state colors, bold flag, filled marker at complete
- [ ] Task 2 — tests updated: plain format per state, segment palette per
      state, degradation, deck color assertions
- [ ] Commit — feat(status): retool work tile — ladder-led layout, state colors
- [ ] Human validation — the footer prints
      `fix-cockpit-wording-and-task-progress ⟩ 6/7 planning › 󰄱 13/23`

### Slice 6 — separator hard colors + mirrored-subject green (follow-up)

Human steering at Slice-5 review (2026-10-23): (1) the big `⟩` separator
follows the deck-wide hard color (thinkingHigh, bold) — separators are
chrome, never state; the minor `›` takes its hard accent likewise. (2) When
the session subject mirrors the focused Spec (the gate law's
"subject mirrors its title"), the subject renders success-green like the
PWD path — the mirror becomes visible at a glance. Estimate delta: +30m.

- [ ] Task 1 — deckWorkSegments: `⟩` thinkingHigh-bold, `›` accent (hard,
      state-independent)
- [ ] Task 2 — titleBandLines: subject green when it mirrors the work
      change slug (alphanumeric-normalized compare)
- [ ] Commit — feat(status): hard separator colors and mirrored-subject green
- [ ] Human validation — the footer shows the green mirrored subject and
      hard-colored separators: `… ⟩ 6/7 planning › 󰄱 15/27`

### Slice 7 — sacred title band; verbose telemetry lanes (follow-up)

Human steering at clock×cost review (2026-10-23): line 2 stays CLEAN —
subject and the OpenSpec Work tile only; no timers, no icons, no chrome.
Session elapsed is discarded entirely. The 󰠭 liveness icon + turn time +
turn tokens move to the activity lane's right as one aligned cluster
(`󰠭 4:08 · 977.3k`, yellow while live, nothing when idle); span lanes stay
aligned below. The clock-leads frozen contract is amended (Human amendment
2026-10-23, superseding the 2026-10-19 clock-anchor rule). Estimate delta: +1h.

- [ ] Task 1 — titleBandLines: subject + work only; clock lead, timerTile,
      and session elapsed removed; `— no subject` dim fallback preserved
- [ ] Task 2 — activity lane: right cluster `󰠭 <turn-time> · <tokens>`
      (yellow bold time), replacing `this turn X · Y`; idle renders nothing
      on the right
- [ ] Task 3 — mockup/contract tests rewritten subject-led; narrow-frame
      and collapsed-frame cases updated
- [ ] Commit — feat(status): sacred title band, turn telemetry below
- [ ] Human validation — line 2 reads subject + Spec only; the turn cluster
      ticks below while live, vanishes when idle

### Slice 8 — OpenSpec-named rung replaces the invented phase word (follow-up)

Human steering at ladder-label review (2026-10-23): `6/7 planning` named a
hard-coded phase word; the rung name must come from OpenSpec — the status
artifacts' last-done id (`6/7 tasks`). No invented vocabulary survives; the
executing tint dies with the word. Estimate delta: +30m.

- [ ] Task 1 — collector: ladder.rung from artifacts (last-done id)
- [ ] Task 2 — phase retired through derive/parse/segments; the rung renders
- [ ] Commit — fix(status): open-spec-named rung replaces invented phase word
- [ ] Human validation — the footer prints `… ⟩ 6/7 tasks › 󰄱 d/t`

## Verification

Deterministic, nearest-focused-first: `npm run test:status` → `tsc --noEmit`
→ `npm run lint` → `npm run format:check`; then the full package check
(`npm run check:components`) before baseline refresh. Then the refined
Requirements' Human Validation Process — the one human-only act: the human
glances at the footer Work tile and a fresh agent surface, confirming all
three observations (`4/7` print · mid-ladder change-only tracking ·
cockpit-free agent injection) — together VALID.

## History

Evidence as of 2026-10-23 — spike `spike-slice-counts` (2 Slices, 4 of 7
checkboxes): `openspec list --json` → `completedTasks: 4, totalTasks: 7,
status: "in-progress"`; `openspec instructions apply --json` → `state:
"blocked"`, `progress: {total: 0, complete: 0}` (applyRequires demands the
full 7-rung ladder); `collectOpenSpec` prefers apply-progress and `??` does
not rescue a present zero → the footer prints `0/0`. Supporting findings:
`title-state.ts:189` fabricated zeros; `index.ts:1205` change-only refusal.
The spike's deletion was gate-blocked (unaccounted mutation); it is retained
as the 4/7 validation fixture pending the human's word.
