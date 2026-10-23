# Learnings

## Estimation adjustments

- Pinned: 4–7 focused hours (Plan, 2026-10-23) · Actual: ~4.5 hours across
  nine executed slices · Delta: within band on paper, triple the slice
  count (3 planned → 9 executed).
- Cause: human-in-the-loop design iteration — the Work label was re-designed
  four times (V1 rainbow → V3×V6 → hard separators → OpenSpec-named rung)
  after live validation, each steering producing a follow-up Slice. The band
  held because per-slice work stayed small; the slice count grew by design.
- Sharpen for next Estimate: budget one follow-up Slice per UI surface that
  gets validated by eye — the first render always teaches.

## Skills adjustments

- Pi extension API (`/usr/lib/pi/docs`) — sharpen: `color()` theme keys and
  segment composition patterns now proven across deck + title-state.
- Frozen status contract (`docs/status-architecture.md`) — sharpen: contract
  amendments are Human-dated comments in code (2026-10-19, 2026-10-23
  precedents); keep that convention.

## New skill creation suggestions

- `showcase-script` — when UI steering is needed, render candidate variants
  with real ANSI in a /tmp script the human picks from by example
  (precedents: /tmp/work-tile-variants.mjs, /tmp/clock-turn-variants.mjs).
  Trigger: any "can I choose by examples" steering. Scope: one file, no
  repo churn.

## Surfaced bugs / errors / technical debt

- Descoped Slices (source: archive directive) — severity: feature-gap —
  routing: follow-up Spec — change-only focus tracking (`index.ts:1205`
  refusal; the mid-ladder catch-22 observed live) and agent-facing cockpit
  wording (`AGENTS.md` 8/37, `src/health.ts:92` WARN).
- Spinner `⠦` riding the turn cluster (source: Slice 7 validation) —
  severity: polish — routing: optional follow-up.
- Gate engine vintage drift (source: session start) — severity: tooling —
  routing: external — pi-openspec-gate still hints `--schema mission`;
  schema renamed to `spec` v3. Human's to cure.
- Fourteen pre-existing format warnings in `.github/skills/*` (source:
  Slice 1 checks) — severity: hygiene — routing: release gate — formatted
  in the archive commit to let `just publish` pass.

## Provenance

- Commits: dfd4959, 2afd4e3, 47b84f7, 76c0ff8, 796c0e1, 2b12d5e, 22960d0,
  637d118, 2e95a5d, 30efcd4, 9afe03e, 6e793a4, e66aba6 (+ archive/release
  commits). Date: 2026-10-23. Total elapsed (Slice Task sums): ~2.8h
  recorded; wall ~4.5h including design consultation.
