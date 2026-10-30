# Investigate

> Spec: simplify-session-focus-surface · aim at the Brainstorm's Questions

## Findings

**Instrument inventory** (`packages/status/index.ts`): `work_focus` L1363, `stage` L1394, `subject` L1429, `openspec_focus` L1463. Handlers: `applyWorkAction` L1118, `applySubjectAction` L1096, `applyOpenSpecFocusAction` L1175, `declareStage` L757.

**Already automatic (OpenSpec derivatives — all keep):** taskflow phase promotion drives the header stage (`taskflowUpdateHeaderPhase`, publisher.ts L706; `taskflowInitialHeaderPhase` L687); taskflow `run` change/task args auto-select focus (`taskflowRunFocus`, active-work.ts); task titles/progress come from OpenSpec metadata once focused; aborted/answering/listening/understanding are event-inferred (index.ts L724, L923, L928, L954). `runtimeSpans.setStage` (runtime-runs.ts L184) keeps inference with "declaration beats inference" — only the declaration *source* (the tool) goes away.

**Validation projection ownership:** `work_focus` state `validation` drives `waiting · awaiting-validation` (index.ts L740–744, L947). Folding it into focus state (`TaskOpenSpecFocus` + awaiting-validation flag) preserves the projection while making it an OpenSpec derivative, per the Human's rule.

**The systematic subject fault is an open-loop delivery bug, not dead code:** Pi 1.4.0 supports `promptGuidelines` — `dist/core/system-prompt.js` `buildRules` merges per-tool guidelines into the Rules section (CHANGELOG: promptSnippet→Available tools, promptGuidelines→Guidelines). The first-turn rule reaches every agent and reliably loses: (1) one dedup'd bullet buried upstream of the addenda, AGENTS files, skills, and schemas; (2) it must fire on the turn with peak task-attention; (3) the system prompt is static — nothing ever re-surfaces the obligation, and the failure is visible only to the Human (dim placeholder). Agent-visible channels in Pi are exactly two: tool schemas (re-sent per request, actively consulted — behavioral rules belong in `description`) and tool results (mid-session; the gate's denial remedies already prove this channel works).

**Frozen contract:** `deck.ts` L180–253 — line-2 placeholders are Human amendments (2026-10-19, 2026-10-23): dim placeholders, never empty bands; subject-mirrors-focus renders green; Work tile "derived from OpenSpec focus, never authored here". Enforcement changes must not touch this contract.

**Compatibility:** restore readers (`restoreSessionWorkFocus`, `restoreSessionSubject`, active-work.ts) walk entries newest-first and skip unparseable entries. Keeping the readers while deleting the writer tools preserves old-session rendering, fail-soft. The `stage` tool's message conflates "unchanged" with "no active turn span" (index.ts L1413, runtime-runs.ts L184–189) — deletion dissolves the bug.

**External lockstep:** `@aemonge-dev/pi-openspec-gate` `config.json` `accountingTools` lists all four tools; the Ramona loop prompt in `~/.pi/agent` instructs `stage`/`work_focus` calls. Both are outside this repository and out of scope here.

**Pi title fact:** Pi core has no auto-generated session titles — only manual `/name`/`--name`; extensions can read (`getSessionName`, `session_info_changed`) but not write the name. The subject tool exists to fill that slot; it cannot be deleted, only simplified.

## Options

- **Rename `subject` → `title` vs keep the name:** rename matches the agreed surface ("focus/title") and costs one registration + tests + loop-prompt word; keeping avoids the rename churn but preserves a name the Human explicitly replaced in intent.
- **Validation flag semantics:** auto-clear on next `set`/`replace`/`clear` (no new action vocabulary) vs an explicit `confirm` action (louder Human-ack, more surface).
- **Enforcement placement:** rule text into tool `description` (per-request salience, zero API risk) vs keeping `promptGuidelines` as well (two sources, drift risk) vs loop-prompt-only (proven weak alone).
