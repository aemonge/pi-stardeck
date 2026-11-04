# Plan

> Spec: pure-renderer-split · consult `openspec/learnings/estimation.md` and `skills.md` (absent — bare)

## Estimate

3–5 h · medium confidence (0.7) — the moves are verbatim from a line-anchored inventory, but the
surface is wide (~15 source files + 5 test files across three packages), and the two real risks are
`tool_call` composition semantics between the packages and the Slice-1 interim window where both
packages register `openspec_focus`. Pinned at commit time.

## Skills

`bare — no catalog skill matches TypeScript Pi-extension work; conventions live in-repo (AGENTS.md, current Pi docs under /usr/lib/pi/docs, defensive-boundary doctrine)`

## Workflow

Direct — the Human-approved brief (2026-11-04) fixed the route; investigation corrected one
attribution and retired the rest. Committed choices:

1. **Contract enforcement: cross-package test assertion** — work-state's suite imports
   `../status/src/active-work.ts` and asserts byte-identical `OPEN_SPEC_FOCUS_ENTRY_TYPE`. The
   duplicated-golden variant lost (a one-sided golden edit passes CI green); the shared-constants
   module lost (it is exactly the cross-package runtime import the brief forbids).
2. **work-state registers before status**: `src/index.ts` gains `workState(pi)` immediately before
   `galacticaStatus(pi)` — the umbrella root `pi.extensions: ["./src/index.ts"]` stays untouched,
   and `workspaces: ["packages/*"]` picks up the new package; only the root `test:work-state`
   script + `test:components` inclusion are added. Rationale: the guard's `tool_call` adjudicates
   ahead of status's phase-header handler; whether a block short-circuits later handlers or
   composes, status's observation of a blocked run is transient. Slice 1 proves the semantics with
   a two-handler test instead of trusting either assumption.
3. **Conflict message**: the brief's exact rewording — `clear or replace the OpenSpec focus
   (explicit Human direction) before starting a conflicting run`.
4. **`fix-pinned-event-types`: superseded by this change** — its two committed slices hardened the
   auto-title block Slice 2 deletes; its archive note references this change. Validating doomed
   code spends Human time on removals.
5. **Deck `gauge.ts`: delete the `'session-work'` selection case** — header events are live-only
   (never persisted), so no old-session tolerance debt exists; `'legacy'` stays the final
   fallthrough.

## Slices

### Slice 1 — packages/work-state owns focus; status untouched

- [ ] scaffold `packages/work-state/`: `package.json` (name `work-state`, `pi.extensions:
      ["./index.ts"]`, same peerDeps, same scripts shape — `test` via
      `node --test --experimental-strip-types test/*.test.ts`), `tsconfig.json` cloned from status
- [ ] `index.ts`: `openspec_focus` tool block verbatim (status L1348–1385 — name/label/description/
      parameters byte-identical), `applyOpenSpecFocusAction` + `persistAndApplyFocus` (the focus
      `appendEntry`) verbatim, and the conflict guard as work-state's own `tool_call` handler
      (from status L1229–1246) with the reworded message; emits `pi.events` `'focus-changed'` after
      each successful write
- [ ] local copies from `active-work.ts` (no cross-package runtime imports):
      `OPEN_SPEC_FOCUS_ENTRY_TYPE`, focus types + `NO_OPEN_SPEC_FOCUS`,
      `taskFocus`/`parseOpenSpecFocus`/`restoreOpenSpecFocus`/`sameTaskFocus`/`sameOpenSpecFocus`/
      `taskflowRunFocus`
- [ ] tests: port focus tests from `status/test/active-work.test.ts`; contract test asserting
      work-state's constant `===` status's exported constant; conflict-guard test (block + exact
      message + non-conflict pass-through); `focus-changed` emission per successful write
- [ ] `README.md`: owns focus entries; entry name documented as interface-not-ownership; lists
      external reader `pi-openspec-gate`; explicitly no slash command — tool only, set on explicit
      Human direction
- [ ] root `src/index.ts`: register `workState(pi)` before `galacticaStatus(pi)`; root
      `package.json`: add `test:work-state`, include it in `test:components`
- [ ] verify: `npm run check` in `packages/work-state` and `packages/status`; root `format:check` ·
      `lint` · `typecheck` · `test:work-state` · `test:status` · `test:stardeck` ·
      `check:package:load`
- [ ] baseline: `node scripts/check-baseline.mjs --write` → `npm run check:baseline` green
- [ ] commit `feat(work-state): own OpenSpec focus entries and taskflow conflict guard` ·
      validation: live session — `openspec_focus` tool present, set via tool writes the entry,
      deck repaints; `/openspec-focus` still present (its retirement is Slice 2)

Named risk for this slice: during the Slice-1 window, status still registers `openspec_focus` too —
duplicate tool names across extensions. `check:package:load` and the live validation surface a
collision if Pi rejects duplicates or resolves them by last-wins; if behavior is wrong, Slice 1
folds in status's tool-block deletion and the plan records the deviation (Slice 2 then covers only
the title/subject/session-work retirement).

### Slice 2 — status shrinks to pure renderer; session-work retires

- [ ] `packages/status/index.ts`: delete the `title` and `openspec_focus` tool blocks, the
      `/openspec-focus` command, the auto-title block in `before_agent_start`, the conflict guard
      from its `tool_call`, all three `appendEntry` writers, and the `ctx.ui.setTitle` painting
      (L694 region); retire `applyTitleAction`, `titleFromPrompt` usage, `persistAndApplySubject`;
      keep phase-header lifecycle, defensive focus + legacy-subject reads, the three
      `galactica-status*` commands, title-activity feed
- [ ] subscribe `pi.events` `'focus-changed'` → repaint; `session_start`/`session_tree` drop
      workFocus restore and keep legacy subject restore; subject chip uses the new
      `formatActiveWorkTitle` chain: task focus → native session name → legacy subject → dir → `π`
- [ ] retire session-work and the written subject type across status: `active-work.ts`
      constants/parsers/comparators, `types.ts:196`, `reducer.ts` L55/L156, publisher
      `SESSION_WORK_WIDGET_ID` (L27) + widget (L281) + `HEADER_SELECTION_SOURCES` entry (L471) +
      `headerSelection` branch (L562) + subject write path; tests `reducer.test`, `parity.test`,
      `publisher.test`, `active-work.test`
- [ ] `packages/pi-stardeck`: `gauge.ts` drops the `'session-work'` selection case; `deck.test.ts`
      updated; READMEs — status (pure renderer; entry names as read-interface) and pi-stardeck
      (work-state's was done in Slice 1)
- [ ] verify: `npm run check` in the three touched packages; `rg -n "session-work"` → zero code
      references (README history notes acceptable); `rg -n "appendEntry|registerTool|setTitle"
      packages/status` → zero hits
- [ ] baseline: `node scripts/check-baseline.mjs --write` → `npm run check:baseline` green
- [ ] commit `refactor(status): shrink to pure renderer; retire session-work` · validation: the
      live checklist below

## Verification

Deterministic: both Slices' verify lines — root `npm run check` gates (baseline, package:load,
format, lint, typecheck, tooling + component tests); the two `rg` sweeps from Slice 2.
`check:openspec` stays red for the known spec-family reason until `data-driven-skip-specs` lands —
expected, not a Slice failure. The one human-only act: live pi session — fresh session named by
pi-title shows on the deck chip and the terminal titlebar is painted only by pi-title; focus set
via the `openspec_focus` tool → deck repaints; manual rename via the session picker sticks;
resuming an OLD session renders via the legacy subject path; status appends zero entries (session
jsonl diff); `title` tool and `/openspec-focus` command absent; the three `galactica-status*`
commands present.

## History

- 2026-11-04 — drafted after granted brainstorm/investigate; integrates the investigate
  falsification (the guard lives in `tool_call`, not `before_agent_start`); no deviations yet.
- 2026-11-04 — Slice 1: the named duplicate-tool risk fired (load probe rejects a second
  `openspec_focus` registration); the pre-agreed fallback executed — status's tool block deleted
  in Slice 1, its five tool-path tests moved out, Slice 2 scope shrinks accordingly.
- 2026-11-04 — Slice 2: the band chip renders the `formatActiveWorkTitle` chain through the
  title-state `subject` slot (`SUBJECT_MAX` 180 = the chain's bound — the designed seam);
  `ctx.ui.setTitle` deleted, so the terminal titlebar is pi-title's alone. The ledger lost the
  `focus/work` event and the reducer lost the `work` fact; write-path tests moved to work-state
  or retired; rendering tests seed branch entries instead of driving deleted write paths.
