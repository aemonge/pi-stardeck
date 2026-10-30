# Plan

> Spec: simplify-session-focus-surface · consult `openspec/learnings/estimation.md` and `skills.md`

## Estimate

2–3.5 h focused work · high confidence (0.85) — every target line already read and verified during review; the only open breadth is test-suite fallout in `packages/status/test/active-work.test.ts` and `test/local-load-probe.test.ts`. Pinned at commit time.

## Skills

`bare — no catalog skill matches TypeScript Pi-extension work; the conventions live in-repo (AGENTS.md, frozen deck contract, existing test patterns)`

## Workflow

Direct route, because the investigation retired the unknowns — with the three Investigate Options committed:

1. **Rename `subject` → `title`** — the Human's "focus/title" surface intent outweighs rename churn; the loop-prompt lockstep is a word swap in a follow-up brief.
2. **Validation flag auto-clears** on next `set`/`replace`/`clear` — smallest action vocabulary; an explicit `confirm` action was rejected as more surface for no added truth (the Human's next direction *is* the confirmation).
3. **Enforcement rides the tool `description`** (per-request salience, single source of truth) — `promptGuidelines` arrays are dropped rather than kept alongside (drift risk); loop-prompt hardening stays an out-of-repo follow-up.

Ordering: the validation flag lands before `work_focus` dies so the `waiting · awaiting-validation` projection never has an unreachable window.

## Slices

### Slice 1 — Fold awaiting-validation into openspec focus

- [x] extend `OpenSpecFocus` (`TaskOpenSpecFocus.awaitingValidation: boolean`) in `src/active-work.ts`; `taskFocus` keeps defaulting it false; `sameOpenSpecFocus` compares it
- [x] `parseOpenSpecFocus`/`restoreOpenSpecFocus` round-trip the flag; malformed old entries still parse (flag absent → false)
- [x] `openspec_focus` tool: `validate` action; `set`/`replace`/`clear` auto-clear; status and refusal messages state the flag
- [x] runtime projection: flag drives `waiting · awaiting-validation` (replaces the work-focus-driven path at index.ts L740–744/L947); `setFocus` publishes on flag change
- [x] `/openspec-focus validate` command verb
- [x] tests: flag lifecycle (set → validate → auto-clear on set/replace/clear), projection wiring, old-entry parse compat
- [x] commit `feat(status): fold awaiting-validation into openspec focus` · validation: live session — focus a change, call validate, see `waiting · awaiting-validation`, next set clears it

### Slice 2 — Rename subject to title; rules move into descriptions

- [ ] rename the registration to `title`; `description` carries the first-turn behavioral rule (≤120 chars, never raw prompt text, revise only on topic shift)
- [ ] drop both `promptGuidelines` arrays (subject's and openspec_focus's — the explicit-Human-direction rule moves into its description)
- [ ] rename `applySubjectAction`→`applyTitleAction`, messages `Session subject:`→`Title:`, promptSnippet updated
- [ ] tests: tool enum, description-content regression pin (the first-turn rule present), sanitizer cap unchanged
- [ ] commit `feat(status): rename subject to title and carry rules in tool descriptions` · validation: new session, first turn, agent calls `title` unprompted; row renders

### Slice 3 — Retire work_focus and stage instruments

- [ ] delete `work_focus` + `stage` registrations, `applyWorkAction`, the `declareStage` call path, `/work` command
- [ ] keep restore readers and runtime render for legacy `session-work.v1` entries (old sessions still show their row, fail-soft)
- [ ] keep `runtimeSpans.setStage` inference (taskflow phases); delete nothing it needs
- [ ] update `packages/status/README.md` + `docs/status-architecture.md`; out-of-scope locksteps recorded as notes (gate `accountingTools`, loop prompt)
- [ ] tests: removed tools absent from registrations, legacy restore still renders, stage inference intact
- [ ] commit `feat(status): retire work_focus and stage instruments` · validation: live session — no `work_focus`/`stage` tools registered; taskflow-driven stage still shows; old session renders legacy focus

## Verification

Deterministic, in order: `npm run format:check` · `npm run lint` · `npm run typecheck` · `npm run test:status` · `npm run test:tooling` · `npm run check:package:load` (offline, credential-free) · `node scripts/check-baseline.mjs --write` then `npm run check:baseline` · `npm run check:openspec`. The ONE human-only act: a live Pi session in this package — focus a change, `validate`, observe the waiting row, confirm the two-tool surface and the renamed title row.

## History

Evidence as of 2026-10-30: brief confirmed in conversation ("action the spec"); `npm run check:baseline` PASS before mutation; brainstorm + investigate artifacts granted (`granted_brainstorm` 12:00:10Z, `granted_investigate` 12:01:45Z).
