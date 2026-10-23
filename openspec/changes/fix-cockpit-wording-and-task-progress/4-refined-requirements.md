# Requirements — refined: the print path into pi is the contract; parsing is route

## Acceptance Criteria

- `AGENTS.md` living lines (8, 37) speak deck wording; historical identifiers
  (73, 137) stay byte-identical.
- The health check WARN speaks deck wording (`src/health.ts`), with its test
  expectation updated in the same change.
- **Print honesty (the core claim):** with a focused change whose tasks ledger
  holds partial progress (e.g. 4 of 7), the Work tile in pi's title band —
  `workTile` → `formatDeckWorkLabel` — prints `4/7`, never `0/0`, under the
  current OpenSpec CLI vintage and the renamed `spec` schema.
- **No fabricated zeros:** a task-mode focus whose collection has no matching
  snapshot never prints `0/0`; it prints real change-level counts or the dim
  hint `— no change owns the moment`.
- **Spec-level focus tracking:** `openspec_focus set` accepts a change-only
  focus (the tool is this repo's own, `packages/status/index.ts:1205`); the
  Work tile prints the focused Spec's title from rung 1, a dim no-ledger
  marker while `6-tasks.md` is absent, and honest counts the moment the
  ledger exists — never `0/0`.
- Soft-fail preserved: absent, erroring, or malformed OpenSpec data degrades
  to the dim hint and never throws into status surfaces.
- Final human-verified claim: a ledger at `4/7` focused in pi shows `4/7` in
  the footer row, and a fresh agent session in this repo receives no cockpit
  metaphor.

## Deltas from Drafted

- **Sharpened** — the counting criteria now name the print surface: the Work
  tile (`packages/pi-stardeck/src/deck.ts` `workTile`, `formatDeckWorkLabel`)
  fed by `deriveTitleWork` (`packages/status/src/title-state.ts:172–193`).
  Honesty is defined at what pi prints, not at what parsers accept.
  *Retires the Idea's authority question: the printed row is the contract; the
  source behind it is Plan's committed route.*
- **Added** — print defect found in research: task-mode focus without a
  matching snapshot hardcodes `{done: 0, total: 0}` (`title-state.ts:189`) —
  a second `0/0` source independent of parsing. In scope: no fabricated zeros
  at the print boundary. *Sharpens the counts-source question.*
- **Added** — counts-precedence fact recorded: `deriveTitleWork` prefers
  `hierarchy.tasks` (old-format ledger parse) over CLI counts, so today the
  tile is only honest when the old mission format parses; the `spec`-schema
  Slice ledger never populates it.
- **Added** — Spec-level focus tracking (human steering, 2026-10-23): the
  focus tool refuses change-only set today (`packages/status/index.ts:1205`,
  the mid-ladder catch-22 observed live), so a Spec cannot be tracked until
  rung 6. In scope: change-only `set`; the Work tile tracks the focused Spec
  pre-ledger — title plus a dim no-ledger marker, counts only once the ledger
  exists. *Sharpens the counts question by defining the pre-ledger print and
  retires the mid-ladder tracking gap.*
- **Removed** — the drafted AC "parsing covers the `spec`-schema ledger" is
  demoted from acceptance to route: route A1 (CLI-authoritative) needs no new
  parsing; routes A2/A3 do. The AC holds either way via print honesty.
  *Retires the must-legacy-parse question: old formats keep parsing; new-format
  parsing is chosen at Plan, not assumed.*
- **Sharpened** — scope now names the print-chain files:
  `packages/status/src/openspec.ts`, `packages/status/src/title-state.ts`
  (`deriveTitleWork`), `packages/pi-stardeck/src/deck.ts` (`workTile`) and the
  label formatter, plus their tests.

## Human Validation Process

Restated — research changed the surface. The human focuses a change whose
ledger holds partial progress (this Spec itself once `6-tasks.md` reaches 4 of
7, or an equivalent fixture) and observes pi's footer Work tile: it must print
`4/7`, not `0/0` — including immediately after setting a task focus before any
snapshot lands. The human also sets a change-only focus on this Spec
mid-ladder — before any ledger exists — and observes the tile tracking it:
title with the dim no-ledger marker. The human then opens a fresh agent
session in this repository
(or greps `AGENTS.md`) and confirms no cockpit metaphor reaches the agent.
All three observations together count as VALID.
