# Plan

> Spec: fix-pinned-event-types · consult `openspec/learnings/estimation.md` and `skills.md` (absent — bare)

## Estimate

15–25 min · high confidence (0.9) — one handler, one structural cast; the only breadth is re-verifying both tsc resolutions and the touched test suites. Pinned at commit time.

## Skills

`bare — no catalog skill matches TypeScript Pi-extension work; the conventions live in-repo (AGENTS.md, defensive-boundary doctrine)`

## Workflow

Direct, because the investigation retired the unknowns — with the committed choices:

1. **Structural cast + value narrowing** — `event as { messageType?: unknown; prompt?: unknown }`, then `!== 'user'` / `typeof === 'string'`; type-generation-proof, no `any`, matches the repo's defensive-boundary doctrine.
2. **Module augmentation rejected** — codifies a guess about a vendor type; a future conflicting declaration breaks loudly.
3. **Dropping the `messageType` guard rejected** — it is load-bearing semantics: custom-message runs must never auto-title.

## Slices

### Slice 1 — narrow the event access; prove both type resolutions

- [ ] `packages/status/index.ts`: narrow `event` before the auto-title guard; comment states why (pinned types vs runtime contract)
- [ ] verify: root `tsc --noEmit`, workspace `tsc --noEmit` (the Human's failing path), prettier check, `test:status`, `test:stardeck`
- [ ] commit `fix(status): narrow before_agent_start event access for pinned types` · validation: live session — first real prompt still auto-titles

## Verification

Deterministic: root + workspace `tsc --noEmit` (both must be green — the Human's host path), prettier check on the touched file, `npm run test:status`, `npm run test:stardeck`. The one human-only act: live session, first real prompt fills the focus row without any tool call.

## History

- 2026-11-01 — drafted after approved brainstorm/investigate; no deviations yet.
