# Execute

> Spec: move-warning-below-prompt · state legend: [ ] open · [x] done ·
> ~ skipped

## Slice 1 — the warning lives below the prompt

- [x] `packages/pi-stardeck/src/deck.ts`: shared width-free deck state
      leaves `renderHeaderDeck`; the warning tail drops;
      `renderWarningLine` exported — `[]` on width 0 or clean, else the
      single `\u26a0 …` line through `fitWithoutDanglingSeparator`;
      severity ternary and `collectDeckNotices` untouched
      started_at: 2026-11-11T17:52Z · ended_at: 2026-11-11T17:56Z ·
      total: ~4 min · check: focused suite ·
      paths: packages/pi-stardeck/src/deck.ts
- [x] `packages/pi-stardeck/index.ts`: `galactica.deck-warning` widget
      registered `belowEditor` beside the deck widget; both clear on
      re-entry and shutdown; `editor-deck` branch untouched
      started_at: 2026-11-11T17:56Z · ended_at: 2026-11-11T18:00Z ·
      total: ~4 min · check: focused suite ·
      paths: packages/pi-stardeck/index.ts
- [x] `packages/pi-stardeck/test/deck.test.ts`: seven warning-placement
      tests flipped — the deck carries no ⚠ anywhere and closes on the
      machine row; `renderWarningLine` owns the line, silence, waiver,
      severity colors, and every-width fit
      started_at: 2026-11-11T18:00Z · ended_at: 2026-11-11T18:10Z ·
      total: ~10 min · check: focused suite ·
      paths: packages/pi-stardeck/test/deck.test.ts
- [x] `packages/pi-stardeck/test/surface.test.ts`: new deck-mode wiring
      test — both keys and placements asserted, snapshot moves the ⚠
      below the prompt, deck stays clean, re-entry clears both
      started_at: 2026-11-11T18:10Z · ended_at: 2026-11-11T18:20Z ·
      total: ~10 min · check: focused suite (hang fixed by closing the
      re-entry session) ·
      paths: packages/pi-stardeck/test/surface.test.ts
- [ ] Commit `feat(deck): move warning notices below the editor prompt`
      hash:
- [ ] Post-commit human validation — see Verification

## Slice 2 — the work tile's next step wears green (amendment)

- [x] `packages/pi-stardeck/src/title-state.ts`: the next-step segment
      paints `success`; the hint comment follows the new color
      started_at: 2026-11-11T18:22Z · ended_at: 2026-11-11T18:24Z ·
      total: ~2 min · check: focused suite ·
      paths: packages/pi-stardeck/src/title-state.ts
- [x] `packages/pi-stardeck/test/title-state.test.ts`: the color-law row
      asserts `success:eospec approve`; compact-yield comment follows
      started_at: 2026-11-11T18:24Z · ended_at: 2026-11-11T18:25Z ·
      total: ~1 min · check: 149/149 ·
      paths: packages/pi-stardeck/test/title-state.test.ts
- [ ] Commit `feat(deck): paint the work tile's next step green`
      hash:
- [ ] Post-commit human validation — see Verification

- [ ] Human validation — response: · outcome: · surfaced:

  gate-attributed · tool: bash · paths: — · at 2026-11-11T17:01:29Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T17:01:35Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T17:01:44Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T17:01:44Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T17:01:53Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/index.ts · at 2026-11-11T17:02:02Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/index.ts · at 2026-11-11T17:02:08Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T17:02:11Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T17:02:37Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T17:02:37Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T17:03:24Z
