# Execute

State legend: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.
A Slice = one conventional commit + one post-commit Human validation. Tasks are quick checkpoints inside a Slice.

## Slice 1 — A: restore Pi's default working indicator

- [ ] delete `ctx.ui.setWorkingVisible(false)`; keep the TUI-guarded timer setup
- [ ] README hide-working paragraph rewritten
- [ ] Commit — fix(pi-stardeck): restore Pi's default working indicator
      hash:

## Slice 2 — B: auto-set the session title from the first user prompt

- [ ] `titleFromPrompt` helper + `before_agent_start` wiring (clear-only, slash-skip)
- [ ] `title` tool description simplified; first-turn nag dropped
- [ ] tests: auto-set, no-override, slash-skip, 120 bound, restore precedence
- [ ] Commit — feat(status): auto-set session title from the first user prompt
      hash:

## Slice 3 — C: pure activity band

- [ ] `deck.ts` phase words, legacy labels, and `awaiting Human` deleted; five observed classes speak
- [ ] band lifecycle = live observed activity only; turn cluster rides; seam rule follows
- [ ] deck tests rewritten for the pure contract
- [ ] Commit — feat(pi-stardeck): pure observed-activity band
      hash:

## Slice 4 — D: task counts from the execution artifact

- [ ] counts derive from parsed artifact tasks; CLI fallbacks preserve zero-guard
- [ ] fixture tests: ticked artifact counts `d/N`; hierarchy + blocked-apply unchanged
- [ ] Commit — fix(status): count openspec tasks from the execution artifact
      hash:

## Slice 5 — strict refactor pass

- [ ] legacy widget branch retired; surface narrows to `'deck' | 'editor-deck'`
- [ ] 50 ms activity timer duty-cycled (ticks only while busy)
- [ ] dead `deckMode` guards folded with proofs; embedder path intact
- [ ] audit ledger recorded below; full suite green
- [ ] Commit — refactor(pi-stardeck): retire dead surfaces and duty-cycle the activity timer
      hash:

## Slice 6 — ledger close

- [ ] `check:baseline --write` + rerun green
- [ ] `npm run check:openspec` green
- [ ] Human validation — response: · outcome: · surfaced:

## Audit ledger (inspected-but-kept)

- `packages/pi-stardeck/src/title-state.ts` — deliberate protocol-boundary copy of the status parser (no cross-package npm dependency; event channel only). KEPT.
- `spanTreeRows` stage words (`working`) — span-row contract, not the banned band narration. KEPT.
- `titleBandLines` legacy selection branch — defensive render for pre-title publisher events. KEPT.
- footer/vim packages — outside this change's confirmed scope; noted as debt candidates.

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/index.ts · at 2026-11-01T10:23:40Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/README.md · at 2026-11-01T10:23:40Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T10:23:47Z
