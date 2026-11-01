# Plan

> Spec: simplify-deck-defaults · consult `openspec/learnings/estimation.md` and `skills.md` (absent — bare)

## Estimate

2–3 h focused work · high confidence (0.85) — every target line read and verified during investigation; the only open breadth is test fallout in `deck.test.ts` (band lifecycle pins, ~20 `awaiting Human`/phase-word assertions) and new fixture tests in `openspec.test.ts`. Pinned at commit time.

## Skills

`bare — no catalog skill matches TypeScript Pi-extension work; the conventions live in-repo (AGENTS.md, frozen deck contract, existing test patterns)`

## Workflow

Direct route, with the five Investigate Options committed:

1. **Auto-title rides `before_agent_start`** (`messageType === 'user'`) — strictly earliest, zero new events; `normalizeTitlePart` + `sessionSubject` already sanitize/bound; slash prompts skipped; set only while `clear`.
2. **Band lifecycle is pure** — exists only while an observed activity is live; the turn chronometer rides it; Pi's restored indicator owns mid-turn liveness (the Human's exact words: nothing displays otherwise).
3. **Count precedence: artifact → CLI apply → list** — file truth first; the 2026-10-23 zero-guard stays for the no-artifact case.
4. **Refactor reach: behavior-preserving retirements with proof** — the legacy widget branch dies (zero production callers, zero tests); the 50 ms timer becomes duty-cycled (ticks only while an activity can render); `deckMode` guards fold only where both shipped surfaces prove them dead; the `editor-deck` embedder path and the title-state parser duplication stay (embedder contract and protocol boundary by design).
5. **Alternatives retired:** cost-only band retention (re-introduces fabricated narration the Human banned); CLI-first counts (re-creates 0/N); cosmetic-only refactor (leaves the smells the Human named); hooking `message_end` for titles (later, racy, no benefit).

## Slices

### Slice 1 — A: restore Pi's default working indicator

- [ ] delete `ctx.ui.setWorkingVisible(false)` (`packages/pi-stardeck/index.ts:530`); keep the TUI-guarded activity timer setup
- [ ] rewrite the README paragraph (`packages/pi-stardeck/README.md` — the hide-working paragraph)
- [ ] commit `fix(pi-stardeck): restore Pi's default working indicator`

### Slice 2 — B: auto-set the session title from the first user prompt

- [ ] `titleFromPrompt(prompt)` helper in `packages/status` (normalize, skip `/`-prefixed, `sessionSubject` bounds 120 + ellipsis)
- [ ] wire into `before_agent_start` (index.ts:1200): set only while subject is `clear`; never override Human/agent/restored titles
- [ ] simplify the `title` tool description — drop the first-turn nag (no longer load-bearing); name, enum, and gate lockstep unchanged
- [ ] tests: auto-set, no-override, slash-skip, bounded 120 + ellipsis, resumed-session restore precedence
- [ ] commit `feat(status): auto-set session title from the first user prompt`

### Slice 3 — C: pure activity band

- [ ] `deck.ts`: `observedActivityLabel` keeps all five observed classes (`editing`/`reading`/`grepping`/`bash`/`subagent`); delete `liveKindLabel`, `ACTIVITY_LABELS` phase words, legacy `activityLabel`, and the `awaiting Human` placeholder
- [ ] `activityBandSpeaks` = a live observed activity only; turn cluster rides the band; dotted-seam rule follows
- [ ] deck tests: phase words and cost-only bands refuse to render; all five classes speak; band retires with the activity
- [ ] commit `feat(pi-stardeck): pure observed-activity band`

### Slice 4 — D: task counts from the execution artifact

- [ ] `openspec.ts`: when parsed artifact tasks exist, derive `completedTasks`/`totalTasks` from their done flags; CLI instruction progress and `list` counts become fallbacks (zero-guard preserved)
- [ ] fixture tests: ticked `4-execute.md`-style content counts `d/N` (not `0/N`); hierarchy-shaped files unchanged; blocked-apply zero-guard unchanged
- [ ] commit `fix(status): count openspec tasks from the execution artifact`

### Slice 5 — strict refactor pass (behavior-preserving, proof-carrying)

- [ ] retire the `legacy` widget branch in `packages/pi-stardeck/index.ts` (zero production callers, zero tests); `ContextHeaderOptions.surface` narrows to `'deck' | 'editor-deck'`; legacy-only imports drop
- [ ] duty-cycle the 50 ms activity timer: tick only while an activity is live (start on busy, stop on settle/shutdown) — identical visual cadence, zero idle wakeups
- [ ] fold `deckMode` guards that are dead in both shipped surfaces (each fold cites its proof); keep `editor-deck` embedder path intact
- [ ] strict audit ledger of everything inspected-but-kept recorded in `4-execute.md` as debt notes
- [ ] full suite green: format/lint/tsc/`test:status`/`test:stardeck`/`test:footer`/`test:vim`/tooling/`check:package:load`/`check:composition`
- [ ] commit `refactor(pi-stardeck): retire dead surfaces and duty-cycle the activity timer`

### Slice 6 — ledger close

- [ ] `node scripts/check-baseline.mjs --write` after the last focused green run; rerun `check:baseline`
- [ ] `npm run check:openspec` green (this execute artifact complete + verdict)
- [ ] stop for Human live validation before the final Task commit

## Verification

Per-file prettier + non-mutating `format:check`; `tsc --noEmit`; `npm run test:status` and `test:stardeck` per slice, full `npm test` before the ledger close; `check:baseline` before first mutation and after `--write`; `check:openspec` at close. Live checks are the Human's: fresh `pi` shows the native `Working…` row mid-turn, the title fills on the first prompt without any tool call, line 3 stays silent between tools and speaks `editing x`/`bash y`/`subagent: z` while they run, and a focused change with ticked execution checkboxes shows `d/N`.

## History

- 2026-11-01 — drafted after approved brainstorm/investigate; no deviations yet.
