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
- [x] Commit `feat(deck): move warning notices below the editor prompt`
      hash: 225a01a110950bb160cac5bb414d924cbaa7c2cf
- [x] Post-commit human validation — see Verification (VALID, live
      cockpit, 2026-11-11)

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
- [x] Commit `feat(deck): paint the work tile's next step green`
      hash: 316a6ef70e279e8a5c8cd585d052515ceb55bbac
- [x] Post-commit human validation — see Verification (VALID, live
      cockpit, 2026-11-11)

## Slice 3 — the notice glyph survives the Human's terminal (amendment)

- [x] `packages/pi-stardeck/src/deck.ts`: the notice glyph swaps
      `\u26a0` → `\u{F727}` (repo's Nerd alert, git-conflict sibling);
      the comment records the Human-directed reason
      started_at: 2026-11-11T18:40Z · ended_at: 2026-11-11T18:42Z ·
      total: ~2 min · check: 149/149 ·
      paths: packages/pi-stardeck/src/deck.ts
- [x] `packages/pi-stardeck/test/deck.test.ts` +
      `packages/pi-stardeck/test/surface.test.ts`: all 26 glyph
      expectations follow the swap
      started_at: 2026-11-11T18:42Z · ended_at: 2026-11-11T18:43Z ·
      total: ~1 min · check: 149/149 ·
      paths: packages/pi-stardeck/test/deck.test.ts,
      packages/pi-stardeck/test/surface.test.ts
- [x] `scripts/warning-preview.mjs`: a committed preview harness that
      provokes the warning — degraded companion verbatim, blocked at
      error, clean silence — no extension, no temp litter
      (`node --import tsx/esm scripts/warning-preview.mjs`)
      started_at: 2026-11-11T18:50Z · ended_at: 2026-11-11T18:52Z ·
      total: ~2 min · check: eslint + prettier clean · commit 027e4a9 ·
      paths: scripts/warning-preview.mjs
- [x] Commit `fix(deck): use the nerd alert glyph on the notice line`
      hash: cc2b8570422b386b885ab7abcb997179825773dd
- [x] Post-commit human validation — see Verification (VALID, live
      cockpit, 2026-11-11 — the bell paints)

## Slice 4 — the notice rings the bell (amendment)

- [x] `packages/pi-stardeck/src/deck.ts`: the notice glyph swaps
      `\u{F727}` → `\u{1F514}` (the bell); the comment records the
      Human-directed reason; the two test files follow (26 references)
      started_at: 2026-11-11T18:58Z · ended_at: 2026-11-11T19:00Z ·
      total: ~2 min · check: 149/149, prettier clean ·
      paths: packages/pi-stardeck/src/deck.ts,
      packages/pi-stardeck/test/deck.test.ts,
      packages/pi-stardeck/test/surface.test.ts
- [x] Commit `fix(deck): ring the bell on the notice line`
      hash: 9f585793f80a92b97508b280c9400577ea7f0a7a
- [x] Post-commit human validation — see Verification (VALID, live
      cockpit, 2026-11-11)

- [x] Human validation — response: VALID · outcome: pass · surfaced:
      none — the glyph saga (U+26A0 blank → Nerd alert → bell) and the
      green next-step tail landed in-change as slices 2–4; nothing
      routes to post-delivery

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

  gate-attributed · tool: bash · paths: — · at 2026-11-11T17:03:29Z
