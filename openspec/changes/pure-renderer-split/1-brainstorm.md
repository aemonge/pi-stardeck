# Brainstorm

> Spec: pure-renderer-split · consult `openspec/learnings/` before drafting (absent)

## Pain

`packages/status` grew from renderer into owner: the 1453-line entrypoint registers the `title`
and `openspec_focus` tools, writes all three session entry types (`appendEntry` L1059/1064/1075),
paints `ctx.ui.setTitle` (L694), and runs the taskflow conflict guard inside `before_agent_start`
(L1201). The focus entry contract `galactica-status.openspec-focus.v1` has an external consumer —
`pi-openspec-gate` in a separate repo reads it via `src/focus.ts` — so writer and renderer must not
drift, yet both live in one package with `/openspec-focus` on top. Session naming is now duplicated:
the external `pi-title` package names sessions natively (and fires `session_info_changed`) while
status still carries the auto-title block and the written `session-subject` type; `session-work`
survives as a concept still written, typed, tested, and consumed in `pi-stardeck`'s gauge.

## Questions

- How does the split keep `galactica-status.openspec-focus.v1` byte-identical when work-state owns
  the write and status keeps only a defensive read — duplicated constants with no cross-package
  imports, enforced by which test shape, and what proves latest-wins/explicit-clear semantics
  survive the move?
- What exactly does work-state take verbatim (tool block, apply/validate logic, focus write,
  conflict guard), how is its conflict message reworded once `/openspec-focus clear|replace` is
  gone, and does handler ordering across the two `before_agent_start` registrations matter?
- What is the full retirement surface for `session-work` and the written `session-subject` across
  status (publisher write paths, `types.ts`, `reducer.ts`, `active-work.ts`, four test files) and
  `pi-stardeck` (`gauge.ts` intent fallthrough, README, deck tests) — and what must stay as
  read-only legacy paths so old sessions still render?
- Does the new fallback chain (task focus → native session name → legacy subject entry → dir → `π`)
  repaint at the right moments — `session_info_changed` for pi-title names, `pi.events`
  `focus-changed` for focus writes — and fail soft when work-state is absent?
- What becomes of `fix-pinned-event-types`, which exists to typecheck the auto-title block this
  change deletes?

<!-- Direction (optional, free): one mutable paragraph of hunch -->

The Human-approved brief (2026-11-04) already fixed the shape: Slice 1 clones status packaging into
`packages/work-state` and moves the tool, write, and guard verbatim with a contract test in place of
shared imports; Slice 2 shrinks status to a pure renderer keeping defensive reads and the
phase-header lifecycle; Slice 3 verifies via `npm run check`, zero-hit greps, and Human-run live
checks. This session's preflight confirmed every brief fact against the tree (1453-line index.ts,
line anchors exact), so Investigate should target the open mechanics — contract-test shape, legacy
read paths, decoupling of the two `before_agent_start` handlers, and `fix-pinned-event-types`
disposition — not re-derive known facts.
