# Requirements — drafted: settles the wording-surface scope and the honest-progress sources

## Draft Acceptance Criteria

- `AGENTS.md` injects no cockpit metaphor: zero case-insensitive "cockpit"
  matches outside historical change IDs (e.g. `consolidate-imported-pi-cockpit`)
  and past commit-subject references.
- The health check no longer emits the WARN string "duplicate cockpit commands
  detected" — it speaks deck wording.
- When a focused change's tasks ledger holds partial progress (e.g. 4 of 7),
  the footer's focused-change row shows `4/7` — never `0/0` — under the current
  OpenSpec CLI vintage and the renamed `spec` schema.
- Task-progress parsing covers the `spec`-schema tasks ledger (`6-tasks.md`,
  per-Slice tasks with Human validation) in addition to the formats parsed
  today; older mission-era formats keep parsing.
- Progress collection still fails soft when the OpenSpec CLI is absent,
  errors, or returns malformed JSON.

## Scope

- `AGENTS.md` — the agent-injected repository instructions.
- The health WARN string in `src/health.ts`.
- Task-progress collection and parsing in `packages/status/src/openspec.ts`
  plus its unit tests.
- Focused-change count rendering in `packages/pi-stardeck` (only as far as
  needed to surface honest counts).

## Out of Scope

- README.md and `docs/` prose — human-facing polish, may ride along later.
- The `package.json` `"cockpit"` keyword — npm search metadata, separate call.
- Public API identifier renames (`COCKPIT_SURFACES`, `CockpitDeckSurface`) —
  source-breaking and baseline-affecting.
- The gate law's own "set the cockpit instruments" wording — it lives in the
  pi-openspec-gate package, not this repository.
- `openspec.old/**` historical archives and past commit subjects.

## Guardrails

- No source mutation before the schema-declared unlock on this focused change.
- `baseline/imported-source.sha256` never modified; `baseline/source.sha256`
  only through the sanctioned `--write` flow after focused checks pass.
- The OpenSpec CLI stays the data authority; parsing degrades softly, never
  throws into status surfaces.
- Historical identifiers (change IDs, commit subjects) stay byte-identical.

## Human Validation Process

The human focuses a change whose ledger shows partial progress (this Spec once
`6-tasks.md` reaches 4 of 7) and glances at the footer row: it must show the
real count, not `0/0`. The human then starts a fresh agent session in this
repository (or greps `AGENTS.md`) and confirms no cockpit metaphor reaches the
agent. Both observations together count as VALID.
