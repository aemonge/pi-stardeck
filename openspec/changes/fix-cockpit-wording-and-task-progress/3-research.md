# Research — fix-cockpit-wording-and-task-progress

## Findings

- The footer's task counts come from a two-source chain: `collectOpenSpec`
  (`packages/status/src/openspec.ts:252–339`) takes `openspec instructions
  apply --json` `progress` first, falling back to `openspec list --json`
  per-change `completedTasks`/`totalTasks`. `parseTaskHierarchy`
  (`packages/status/src/openspec.ts:151–207`) feeds only the per-task step
  display, never the headline counts.
- `parseTaskHierarchy` matches only the old mission-era ledger: `## Task <id>`
  headers, `- [ ] Step` checkboxes, `### Human validation` sections — verified
  against `openspec.old/changes/develop-frozen-status-architecture/tasks.md`,
  which uses exactly that shape (`## Task 1 — …`, `- [x]` steps).
- The renamed `spec` schema's ledger (`6-tasks.md`) is a different shape:
  `## Slice N — <title>` sections holding sibling checkboxes `- [ ] Task N —`,
  `- [ ] Commit —`, `- [ ] Human validation —` (template captured from
  `openspec instructions tasks`, 2026-10-23). The hierarchy parser does not
  match `## Slice` headers; the flat `parseTaskMarkdown` would count Commit and
  Human-validation checkboxes as tasks, inflating totals.
- Live evidence: `openspec list --json` on this change (2026-10-23, no ledger
  yet) reports `"completedTasks": 0, "totalTasks": 0, "status": "no-tasks"` —
  an honest 0/0 pre-ledger. The observed lie (`0/0` displayed while the ledger
  holds `4/7`) is a ledger-with-progress whose shape the counters do not read.
- A Slice is complete when its Tasks, Commit, and Human-validation checkboxes
  are all `[x]` (schema template legend: pending/running/complete) — so honest
  Slice counting needs sibling-aware semantics, not flat checkbox counting.
- Wording inventory (grep, 2026-10-23): `AGENTS.md` lines 8 and 37 carry the
  living cockpit metaphor; lines 73 (`consolidate-imported-pi-cockpit` change
  ID) and 137 (`chore: import Galactica cockpit baseline` commit subject) are
  historical identifiers that stay byte-identical per the Guardrails;
  `src/health.ts:92` emits the WARN `"duplicate cockpit commands detected"`;
  README (6 spots), the `package.json` keyword, and identifiers
  (`COCKPIT_SURFACES`, `CockpitDeckSurface`) are Out of Scope by the drafted
  requirements.
- Test surface: `packages/status/test/openspec.test.ts` covers
  `parseTaskHierarchy`/`collectOpenSpec`; focused checks are
  `npm run test:status` plus typecheck/lint per `AGENTS.md` Verification.

## Options

- O1 — CLI-authoritative counts: render only what the CLI's `list`/`apply`
  progress reports. Trade-off: smallest diff and no parser drift, but the deck
  inherits every CLI counter gap across vintages — the exact source of the
  observed `0/0` lie.
- O2 — Ledger-native parsing: teach `openspec.ts` the `spec`-schema Slice
  ledger (Slice done = its Tasks + Commit + Human validation all `[x]`), keep
  old-format parity, CLI JSON demoted to fallback. Trade-off: the deck owns
  honesty at the price of tracking the schema's ledger format as it evolves.
- O3 — Hybrid cross-check: CLI counts primary; when CLI says `0/0` but the
  ledger shows progress, ledger truth overrides. Trade-off: most honest
  display, largest surface to test and maintain.

## Evidence & prices — as of 2026-10-23

- `openspec list --json`: `{"name":"fix-cockpit-wording-and-task-progress",
  "completedTasks":0,"totalTasks":0,"status":"no-tasks"}`.
- Parser facts: `parseTaskHierarchy` regexes `^##\s+Task\s+([\w.-]+)`,
  `- [ ] Step`, `- [ ] Human validates` (`packages/status/src/openspec.ts`);
  none match `## Slice N —` or `- [ ] Task N —` siblings.
- Wording price: 2 editable lines in `AGENTS.md`, 1 WARN string in
  `src/health.ts` (+ its test expectation if asserted); zero identifier or
  baseline churn.
- Count price: O1 ~ display-only tweak; O2 ~ one module + tests, no new
  dependencies; O3 ~ O2 plus override plumbing and extra cases.

## Alternatives

- A1 — CLI-authoritative display: the deck shows exactly what the OpenSpec CLI
  counts, ledger untouched.
  · Trade-off: zero parser drift, but CLI counter gaps (like the observed 0/0)
  pass straight to the footer.
  · Pick when the CLI's counters are trusted across vintages and the deck must
  stay thin.
- A2 — Ledger-native Slice parsing: the deck reads `6-tasks.md` itself with
  sibling-aware Slice semantics; CLI JSON is fallback only.
  · Trade-off: the glance at the bridge never lies, but the parser must track
  the schema's ledger format.
  · Pick when mid-vintage drift must not reach the human's footer.
- A3 — Hybrid override: CLI counts stay primary, ledger truth replaces
  demonstrated lies (0/0 with real progress).
  · Trade-off: both honesty and CLI authority kept, at the largest test and
  maintenance surface.
  · Pick when CLI authority matters but a lying footer is unacceptable.
