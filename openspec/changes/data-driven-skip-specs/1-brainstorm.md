# Brainstorm

> Spec: data-driven-skip-specs · consult `openspec/learnings/` before drafting (absent)

## Pain

`scripts/check-openspec.mjs` decides `skip_specs` legality through a hardcoded
schema-name list (`['ramona-idea', 'ramona-plan']`, `ec3873e`, 2026-09-03). The
`spec` schema family — brainstorm → investigate → plan → execute, receipts and
verdicts, no spec deltas — arrived later and was born in violation: the active
change `fix-pinned-event-types` has been red on `check:openspec` since
2026-11-01 (the red surfaced 2026-11-03 when a project-local schema copy made
the full check run again). Every new schema either extends the list (the same
rot as the gate's `accountingTools` — the `subject` → `title` rename severed an
extension's status silently for weeks) or fails a strict validation it can
never satisfy (an artifact flow with no deltas has no `specs/` to validate).
The repo's own doctrine — *the vocabulary is data; the engine hardcodes none of
it* — is violated one repo over, by the verification boundary itself.

## Questions

- How should the check learn a schema's delta-flow from data instead of names —
  and what signal, given the gate validates `x-` tags loudly (new tags need a
  gate release) while openspec strips unknown plain fields silently?
- What is the fail-safe when a schema's yaml cannot be resolved on disk
  (legacy names like `ramona-idea` have no yaml anywhere)?
- Does fixing the script need anything outside this repo (gate release, pi
  core, upstream openspec)?
