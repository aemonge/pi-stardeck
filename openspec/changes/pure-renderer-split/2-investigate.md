# Investigate

> Spec: pure-renderer-split · aim at the Brainstorm's Questions

## Findings

**Falsification — the conflict guard does not live in `before_agent_start`.** The Human-approved
brief (and our brainstorm, following it) attributes the taskflow conflict guard and phase headers
to the L1201 handler. Live read 2026-11-04: `before_agent_start` (`index.ts` L1201–1217) contains
only `runtime?.beginTurn()` and the auto-title block. The conflict guard lives in the **`tool_call`**
handler (L1224–1249): `taskflowRunFocus(event.input)` → on conflict returns
`{ block: true, reason: 'OpenSpec focus is …; use /openspec-focus clear or /openspec-focus replace
<change> <task> before starting a conflicting run' }` — the exact wording the brief rewords. The
phase-header lifecycle also lives in `tool_call` (L1250+), `tool_execution_update` (L1272+), and
`tool_execution_end` (L1290+). Consequence: work-state's moved registration is a **`tool_call`**
handler, and the brief's "both packages register their own `before_agent_start`" reads as
"work-state registers its own `tool_call`". Every other brief fact verified exact: 1453-line
entrypoint; `title` tool L1317; `openspec_focus` tool L1348; `/openspec-focus` command L1389;
`appendEntry` L1059/1064/1075; `ctx.ui.setTitle` L694; `session_start`/`session_info_changed`/
`session_tree` L1170/1189/1193; entry-type constants at `active-work.ts` L3–5 with the
`galactica-status.*.v1` names.

**pi-title plumbing already exists — Slice 2 is a chain change, not new wiring.** `session_start`
already reads `pi.getSessionName() ?? ctx.sessionManager.getSessionName()` and passes it into the
runtime (index.ts L1176–1182); `session_info_changed` already calls
`runtime?.setSessionName(event.name)` (L1189–1191). The registry-pinned
`@earendil-works/pi-coding-agent` types declare both surfaces: `getSessionName(): string | undefined`
(`dist/core/extensions/types.d.ts` L989) and `events: EventBus` (L1077) — no 0.84.4 blocker. The
current fallback chain in `formatActiveWorkTitle` (`active-work.ts` L220–250) is: task-focus detail →
work-focus intent → subject → session name → projectRoot basename → cwd basename → `pi`. The brief's
new chain (task focus → native session name → legacy subject → dir → `π`) moves the session name
**above** the subject and deletes the work-focus branch — a renderer-internal reorder plus removal of
the subject slot from the deck title-state write path.

**Exact move / retire / keep inventory (line-anchored).**
- *Moves to work-state verbatim:* `openspec_focus` tool block (index.ts L1348–1385, name/label/
  description/parameters byte-identical); `applyOpenSpecFocusAction` (L1105+); `persistAndApplyFocus`
  (L1068, `appendEntry` at L1075); the conflict guard (L1229–1246) with `taskflowRunFocus`; from
  `active-work.ts`: `taskFocus`, `parseOpenSpecFocus`, `restoreOpenSpecFocus` (latest-wins reverse
  scan), `sameTaskFocus`/`sameOpenSpecFocus`, `NO_OPEN_SPEC_FOCUS`, the focus types — duplicated
  locally under the no-cross-import rule.
- *Retires:* `title` tool (L1317–1345), `applyTitleAction` (L1083), `titleFromPrompt`
  (`active-work.ts` L119–127), `persistAndApplySubject` (L1063), `/openspec-focus` command
  (L1389–1424), `ctx.ui.setTitle` painting (L694 region), the session-work writer (L1059 + wrapper),
  `restoreSessionWorkFocus`/`parseSessionWorkFocus`/`sessionWorkFocus`/`sameSessionWorkFocus`/
  `SESSION_WORK_FOCUS_ENTRY_TYPE`/`SessionWorkFocus`/`NO_SESSION_WORK_FOCUS`, publisher
  `SESSION_WORK_WIDGET_ID` (L27) + widget (L281) + `'session-work'` in `HEADER_SELECTION_SOURCES`
  (L471) + its `headerSelection` branch (L562), `reducer.ts` L55/L156, `types.ts:196`, tests
  (`reducer.test`, `parity.test`, `publisher.test`, `active-work.test` session-work portions), deck
  `gauge.ts:101` (+ `deck.test.ts`, both READMEs).
- *Stays:* defensive subject read (`SESSION_SUBJECT_ENTRY_TYPE`, `parseSessionSubject`,
  `restoreSessionSubject`, `sameSessionSubject` — legacy sessions render), `src/openspec.ts` disk
  collector, phase-header lifecycle, the three `galactica-status*` commands (L1426–1453),
  title-activity feed.

**Contract-test shape is direct.** Tests run via `node --test --experimental-strip-types`
(`packages/status/package.json` `scripts.test`), so a work-state test can import
`../status/src/active-work.ts` and assert its own constant `=== OPEN_SPEC_FOCUS_ENTRY_TYPE`. The
no-cross-package-import rule binds runtime code; the test suite is the enforcement instrument for
the frozen name — no shared module, no build step.

**`tool_call` composition is the one genuine coupling risk.** Docs: "`tool_call` can mutate input or
block execution" (`extensions.md` L105); handler example returns `{ block: true, reason }`
(L169–177); "A `tool_call` handler failure blocks the tool as a fail-safe" (L260). Nothing states
whether a block short-circuits later handlers. Post-split, work-state (guard) and status (phase
headers, direct-tool activity) both register `tool_call`; execution order follows package load order
in the root umbrella manifest. Plan must pick work-state's position and, if the docs stay silent,
prove the semantics with a two-handler test.

**`pi.events` is the sanctioned channel, present in pinned types.** `extensions.md` L86 lists
`pi.events` for "Communicate with another extension"; `EventBus` typed at `types.d.ts` L1077.
Work-state emits `focus-changed` after each successful write; status subscribes and repaints.
If work-state is absent, no events fire and status still repaints on `session_tree`/`session_start`
— the fail-soft requirement is met by construction.

**`fix-pinned-event-types` is code-complete and unvalidated.** Its execute artifact shows Slice 1
and Slice 2 tasks `[x]`, Slice 2 committed as `8bf1610` ("fire auto-title on the real
before_agent_start shape"), Human-validation boxes empty. This change deletes the auto-title block
both slices hardened, so its remaining open item is Human validation of code destined for removal.
Disposition — validate-then-supersede, supersede now, or leave open — is a Human call at Plan.

## Options — enforcing the frozen `galactica-status.openspec-focus.v1` name

- **Cross-package test assertion** — one work-state test imports status's constant and asserts
  equality. Trade-off: a test-level import creates a build-time edge the runtime rule forbids.
  Pick when: both packages live in this repo (they do).
- **Duplicated golden string in each suite** — no cross-import anywhere; drift caught only if both
  goldens are updated in the same commit. Trade-off: a one-sided edit passes CI green.
  Pick when: the packages are about to split into separate repos.
- **Shared constants module** — one source of truth, zero drift by construction. Trade-off: it is
  exactly the cross-package runtime import the brief forbids, and makes the contract invisible at
  each package's boundary. Pick when: the no-cross-import rule is relaxed.

## Open for Plan

- work-state's position in the root `package.json` extension array, and the `tool_call` order/block
  semantics question above.
- Final conflict-message wording (brief supplies it; `applyOpenSpecFocusAction`'s status/validate
  replies move unchanged).
- `fix-pinned-event-types` disposition.
- Deck `gauge.ts` treatment: status will never emit source `'session-work'` again (header events are
  live-only, not persisted), so the deck case is dead code — brief says it falls through to the
  remaining sources; Plan confirms remove-vs-keep-tolerance.
