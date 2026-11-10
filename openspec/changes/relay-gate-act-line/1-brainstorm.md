# Brainstorm

> Spec: relay-gate-act-line · consult `openspec/learnings/` before drafting (absent)

## Pain

The cockpit's focus row renders only the assistant's declared work — `change › taskId taskTitle` from the session's OpenSpecFocus fed through `formatActiveWorkTitle` (`packages/status/src/active-work.ts`). The pi-openspec-gate independently owns the authoritative next human act per change (`pios-gate act <slug>`, ≥ 0.8.1), but that truth is invisible in the cockpit: declared focus and gate truth can drift apart silently. Divergence must become visible at a glance — the gate owns truth and words; stardeck owns placement only.

## Questions

- Placement: append the act beside the declared task in `formatActiveWorkTitle`'s task branch (`… · gate: <act>`), keeping the gate line commentary — never a replacement for declared focus, never injected into the conversation?
- Cost: statusline-grade code renders constantly — shell out per render only if it measures clean; otherwise cache keyed on the change's meta file (`.openspec.yaml`) mtime, so a grant re-probe happens naturally when the gate stamps the meta?
- Failure surface: gate binary absent, older than 0.8.1 (no `act` subcommand), any non-zero exit (the act command exits 2 on unknown changes), timeout, or empty output — each must render declared focus alone: no error chrome, no retry storm, fail quiet and cheap?
- Boundary: stardeck never parses `.openspec.yaml` or `schema.yaml` and never computes the act — the moment stardeck derives truth, meta format becomes a cross-repo contract. mtime statting is cache invalidation, not parsing.
- Verification: change mid-flow renders declared task + gate act verbatim (including divergence between them); no change focused → segment unchanged; gate binary absent → segment unchanged.

## Direction

Pure placement: `formatActiveWorkTitle` gains an optional gate act rendered beside the task; a new bounded module resolves `pios-gate act <slug>` through the injected `CommandRunner`, cached on the meta file's mtime; the status extension's refresh cycle owns the async resolution and renders synchronously from cache. Any failure renders declared focus alone. Grant/approve stay terminal-only — the extension never stamps anything.
