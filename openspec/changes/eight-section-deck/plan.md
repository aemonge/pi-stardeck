# Plan: Eight-section deck on the title-state contract

- **Idea:** `deck-title-state`
- **Method source:** predefined
- **Method name:** Happy-path
- **Method contract:** Smallest complete contract first — publish the v1
  title-state, render the validated four-line layout, then notices and the
  release. No extras beyond the accepted mockups and schema.
- **Execution source:** native-direct
- **Execution name:** Four ordered slices with two checkpoints
- **Execution reason:** Bounded repo edits against established component
  gates; the layout risk is retired by Human-locked mockups, leaving only the
  activity feed and turn-cost meter as new plumbing.
- **Execution outline:** Task 1 publishes the state; checkpoint; Task 2
  renders the four lines and relocates companions; checkpoint; Task 3 adds
  notices and waiver; Task 4 gates, refreshes baseline, coordinates publish.
- **Estimate basis:** Every rendered segment maps to existing machinery
  except the activity hook and turn-cost meter; deck/status test suites are
  green at v0.2.1 with 320+ cases; both mockups validated by Human on real
  session data.
- **Estimated implementation:** 180–300 minutes across four Tasks; publish
  and validation waits excluded.
- **Estimate confidence:** Medium — schema and layout locked; the turn event
  stream's source of truth (tool execution hooks) is mapped but unwired.
- **Refinement trigger:** Split Task 2 if the four-line rework touches more
  than deck composition and its tests, or Task 1 if the activity feed needs
  its own span-tracking decision.

## The contract

The status package publishes one object on the existing header channel
(`galactica-status:header`, payload gains a `title` field):

```jsonc
{
  "v": 1,
  "subject": "Rethinking titles", // authored once, plain label, or null
  "work": null, // derived: { change, task?, done, total }, or null
  "activity": {
    // observed: newest turn event, or null when idle
    "class": "editing", // editing | reading | grepping | bash | subagent
    "target": "schema.yaml", // short target label, ≤ 48 chars
    "span": "t42", // owning span id (turn, subagent, or bash)
    "parent": null, // parent span id when nested, else null
  },
  "waiver": null, // { id, notice } Human-dismissed notice, or null
}
```

Authorship levels never mix: nothing in the renderer may write any slot.

## Acceptance

- The status package publishes `title` state (schema v1 above) on the
  existing header channel; the header parses it defensively and renders:
  - Line 1: path/git left, companion chips right (relocated from the head)
  - Line 2: `󰠭 clock ⟫ Subject` left, `Work — change · n/m` or the dim
    `— no change owns the moment` right
  - Line 3: `Activity` left (`editing deck.ts`, `reading schema.yaml`,
    `subagent: scout`; `awaiting Human` idle) and `this turn 4.2k · 0:38`
    right
  - Line 4: engine, quota window, machine, global cost left; `⚠ notices`
    right
- Counter tiles (`task 00/00`, `stps 00/00`, `00 › 00`) no longer render
- Goal progress rows render conditionally under line 2; spans rows
  conditionally under line 3 — unchanged behavior
- Both Human-validated mockups reproduce at 100+ columns; the existing
  responsive ladder governs narrower frames

## Expected results per Task

### Task 1 — Title-state publisher

After this Task, with the deck intentionally unchanged:

- **Published payload (idle session):**
  `{"v":1,"subject":"Pivot cockpit to pure pi-starship-header chrome","work":null,"activity":null,"waiver":null}`
- **Published payload (mid-work):**
  `{"v":1,"subject":"Pivot cockpit to pure pi-starship-header chrome","work":{"change":"eight-section-deck","done":1,"total":4},"activity":{"class":"editing","target":"packages/header/src/deck.ts","span":"t87","parent":null},"waiver":null}`
- The turn-cost meter publishes `turn: { tokens: 4200, elapsedMs: 38000 }`
  beside `activity` (zeroed when idle).
- New suites: `title-state` schema/builder tests (≈ 12 cases: null/active
  shapes, malformed rejection, bounds) and runtime feed tests (≈ 8 cases:
  one per activity class + nesting + idle reset). Existing suites stay
  green; no deck test changes.
- **Checkpoint evidence:** `/galactica-status-debug` (extended one line)
  prints the live title-state JSON; the rendered deck is pixel-identical to
  v0.2.1.

### Task 2 — Four-line deck render

- **Rendered (idle, 100+ cols):**
  ```text
 ~/projects/pi-vimux-starship ⟩  main ›  clean                                                  [↻ ▤] ⌬  ⛨
 ────────────────────────────────────────────────────────────────────────────────────────────
󰠭 000:00'00 ⟩ Pivot cockpit to pure pi-starship-header chrome                        — no change owns the moment
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
 awaiting Human                                                                    — · 0 tok
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
󰚩 GPT-5.6 Sol › high ⟩ 󰾆 38% › 󰎞 2 ›  63%                      48.2% › 268M ⟩ 3/3 ⟩ 󰜦 $5.16
  ```
- **Rendered (mid-work, 100+ cols):**
  ```text
 ~/projects/pi-vimux-starship ⟩  main ›   2                                          [↻ ▤] ⌬  ⛨
 ────────────────────────────────────────────────────────────────────────────────────────────
󰠭 000:04'12 ⟩ Pivot cockpit to pure pi-starship-header chrome                        eight-section-deck · 1/4
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
 editing packages/pi-stardeck/src/deck.ts                                  this turn 4.2k · 0:38
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
󰚩 GPT-5.6 Sol › high ⟩ 󰾆 38% › 󰎞 2 ›  63%                      48.2% › 268M ⟩ 3/3 ⟩ 󰜦 $5.16
  ```
- Amendment at the 2.4 checkpoint (2026-10-14): the Human directed the
  rule beneath line 1 removed — line 1 is the deck's header strip, at
  most three strong rules on screen (the deck's two plus pi's prompt
  border); the pi-status severity counts that rode that rule now ride
  line 1's right end beside the companion chips. (Superseded by the
  second amendment below; the severity counts keep their line-1 home.)
- Second Human amendment at 2.4 review, 2026-10-14: strong bookends,
  dotted internal seams, telemetry split across line 4 ends — the deck
  opens with a full ─ rule beneath line 1 and closes with a full ─
  rule after line 4 (nothing renders beneath it); the seams under
  lines 2 and 3 are ┈; line 4 splits into the engine/context group
  flush left and the machine group (quota flame, machine readings,
  global cost) flush right, the machine group yielding first on
  narrow frames. (Closing rule superseded by the third amendment
  below; the opening rule, dotted seams, and the line-4 split stand.)
- Third Human amendment at 2.4 review, 2026-10-14: deck ends at the
  telemetry row; pi's prompt chrome closes the block — no trailing rule
  (the closing rule stacked against pi's own prompt/input chrome below
  the deck, reading as a doubled big separator).
- Engine/context hold line 4's left end; the quota flame, machine
  readings, and global cost hold its right end (second amendment); the
  notices slot's home is an open Step-3 question (flagged under
  tasks.md 2.4).
- Counters `task 00/00`, `stps 00/00`, `00 › 00` are absent in every state.
- Companion chips render right-aligned on line 1, keep bold, spacing, and
  on/warn/off colors, and persist on narrow frames (path yields first, per
  the standing always-visible contract).
- Header suite grows ≈ 14 cases (idle/mid-work lines, work null/active,
  activity classes, cost meter, counter absence, relocation, narrow
  persistence); existing assertions lockstepped, none deleted silently.
- **Checkpoint evidence:** your live session matches both blocks above.

### Task 3 — Notices and waiver

- **Notice slot examples, line 4 right:**
  - clean: slot empty (dim nothing rendered)
  - one source: `⚠ graphify · update recommended`
  - mixed, ranked (goal hint < companion warn < diagnostics):
    `⚠ 1 open goal · /goal-focus · appa unreachable · 2 diagnostics`
- Sources: companion warning texts, unfocused open-goal hint, diagnostics
  counts — exactly the signals that scatter today.
- Waiver: `{"id":"graphify-stale","notice":"graphify · update recommended"}`
  suppresses that exact text; absence of the waiver restores it.
- Header suite grows ≈ 6 cases (each source, ranking, waiver on/off).
- Task-3 placement default (Human-deferred from 2.4, pending the 3.3
  review): when notices are non-empty they own line 4's right end and the
  machine group (quota flame, machine readings, global cost) yields
  wholesale, riding the same fit ladder as the existing narrow-frame
  yield — the right group renders only when it fits beside the engine
  group, which stays flush left. Implemented as the default because it
  keeps the slot whole and legible at one glance.
  - Open 3.3 question: the alternative — the machine group compacts
    (drops segments) instead of yielding wholesale, so telemetry and
    notices share line 4 — trades glanceability for telemetry
    persistence; arbitrate at the mockup review.
- Task-3 amendment (2026-10-14): the blocked/approval signals lost with
  the Step-2 lifecycle-tile deletion are restored as notice texts at the
  top of the companion group (`⛔ blocked`, `approval required`, the
  publisher field wording), and the publisher's header diagnostics gained
  a minimal `count` field (errors+blockers+warnings) to feed the
  `N diagnostics` notice.
- **Final validation evidence:** idle + mid-work sessions match the accepted
  layout; warnings appear and clear with their sources.

### Task 4 — Gate and release 0.3.0

- Full gate green: `tsc`, `test:status`, `test:header`, `test:tooling`,
  `format:check`, `lint`, `check:composition`, `check:package`,
  `check:package:load`; `check:baseline` PASS with refreshed manifest
  (`baseline/source.sha256`; `imported-source.sha256` untouched).
- Release handed to Human: `just publish 0.3.0` → `git push --follow-tags`
  → swap with the explicit version pin; `pi list` shows
  `npm:@aemonge-dev/pi-vimux-starship@0.3.0`.
  - Note: 0.3.0 published early per Human decision 2026-10-14 (rename +
    deck); notices/waiver target the next release — re-cut this step's
    version before handoff.

## Scope

- In: `packages/status` (title-state schema, activity hook from tool
  executions, per-turn token/elapsed meter, notices aggregation, waiver
  field), `packages/header` (four-line deck composition, companion
  relocation, counter removal, parsing), tests lockstep, baseline refresh,
  `just publish 0.3.0` coordination.
- Out: goal takeover logic, spans machinery, telemetry contents beyond
  placement, the package rename (separate decision), upstream goal-x ask.

## Architecture

Native direct execution. Runtime capabilities: writable repo root, offline
component gates, read access to session entries and OpenSpec state. The
`waiver` semantic is carried and rendered as notice suppression; if Human
redefines it in review, only the renderer clause changes.

## Verification

Deterministic: `tsc`, `test:status`, `test:header`, `test:tooling`,
`format:check`, `lint`, `check:composition`, `check:package(:load)`, baseline
refresh. Manual at checkpoints: both mockups on a live session, idle and
mid-work states.

## Human validation

Checkpoints after Task 1 (state published, deck unchanged) and Task 2 (four
lines live). Final `VALID` after Task 3 closes the slice; Task 4 is the
Human-fired release.
