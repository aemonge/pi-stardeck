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
- [x] commit `fix(status): narrow before_agent_start event access for pinned types` · validation: live session — first real prompt still auto-titles — **failed live 2026-11-03; routed to Slice 2**

### Slice 2 — fire the auto-title on the real runtime shape

- [x] `packages/status/index.ts`: drop the phantom `messageType` cast/guard; read `event.prompt` via the pinned `BeforeAgentStartEvent` (typed handler, zero casts); comment records the emission truth
- [x] `packages/status/test/active-work.test.ts`: fixtures through a typed `BeforeAgentStartEvent` helper — runtime shape drift fails `tsc` here, not silently at runtime; malformed raw emit proves fail-soft; custom-message fixture replaced (the runtime never emits this event for them — `agent-session.js`)
- [x] verify: `npm run typecheck` (root + workspaces) · `npm run format:check` · `npm run lint` · `npm run test:status` · `npm run test:stardeck`
- [x] baseline: `node scripts/check-baseline.mjs --write`, then `npm run check:baseline` green — manifest stale from the v0.11.0 line (`deck.ts` @ 5627556) folds in here; pre-existing committed work, not Slice-2 drift
- [ ] commit `fix(status): fire auto-title on the real before_agent_start shape` · validation: live session — first real prompt fills the focus row without any tool call

## Verification

Deterministic: root + workspace `tsc --noEmit` (both must be green — the Human's host path), prettier check on the touched file, `npm run test:status`, `npm run test:stardeck`. The one human-only act: live session, first real prompt fills the focus row without any tool call.

## History

- 2026-11-01 — drafted after approved brainstorm/investigate; no deviations yet.
- 2026-11-03 — Slice 1's live validation failed (`— no subject`); findings
  corrected in Investigate; Slice 2 replaces the guard with the typed runtime
  shape.
