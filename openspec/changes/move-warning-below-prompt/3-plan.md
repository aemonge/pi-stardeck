# Plan

> Spec: move-warning-below-prompt · consult `openspec/learnings/estimation.md`
> and `skills.md` (both absent)

## Estimate

30–45 min · confidence 0.9 — one renderer seam plus one widget registration;
the mirrored test flips are mechanical, and the preflight already pinned
every line number (2-investigate.md).

## Skills

`bare — no catalog skill matches TypeScript Pi-extension work; the
conventions live in-repo (AGENTS.md, deck comment law, mirrored test style)`

## Workflow

Direct — Investigate found a single clean seam (the `[dottedRule, warning]`
tail) and one genuine fork: grow the editor-deck embedder contract vs leave
it. The fork retired on evidence (zero runtime composition of
`editor-deck`; the test harness is the only consumer), so no alternatives
carry forward — the direct route is the whole route.

## Slices

### Slice 1 — the warning lives below the prompt

- [ ] `packages/pi-stardeck/src/deck.ts`: extract the deck-state builder —
      `renderHeaderDeck`'s inline state object moves into a width-free
      closure so both renderers read one truth — then drop the warning
      tail from `renderHeaderDeck` (the `warning`/`[dottedRule, warning]`
      spread) and export `renderWarningLine(state, width, theme):
      string[]`: `[]` on width 0 or no notices, else the single
      `\u26a0 …` line through `fitWithoutDanglingSeparator`; severity
      ternary and `collectDeckNotices` untouched
      started_at: · ended_at: · total: · check: · paths:
- [ ] `packages/pi-stardeck/index.ts`: `WIDGET_KEY_WARNING =
      'galactica.deck-warning'`; a `renderWarning(width, theme)` closure
      beside `renderDeck` reading the shared state; the default deck
      surface registers both widgets (deck `aboveEditor`, warning
      `belowEditor`) and `clearWidget` clears both on `session_start`
      re-entry and `session_shutdown`; the `editor-deck` branch stays
      widget-free
      started_at: · ended_at: · total: · check: · paths:
- [ ] `packages/pi-stardeck/test/deck.test.ts`: the two warning-placement
      tests flip — `renderHeaderDeck` ends on the machine row with no ⚠
      and no trailing seam; `renderWarningLine` owns the line (verbatim
      notices, error severity for blocked) and `[]` when clean or waived
      started_at: · ended_at: · total: · check: · paths:
- [ ] `packages/pi-stardeck/test/surface.test.ts`: new deck-mode wiring
      test — capture `setWidget` calls, assert both keys and placements
      (`galactica.work-identity` aboveEditor, `galactica.deck-warning`
      belowEditor), the warning factory renders the ⚠ line with notices
      and `[]` clean, and cleanup clears both; the editor-deck
      zero-registration assertion stays untouched
      started_at: · ended_at: · total: · check: · paths:
- [ ] Commit `feat(deck): move warning notices below the editor prompt`
      containing only the four files above plus this change's progress
      started_at: · ended_at: · total: · check: · paths:
- [ ] Post-commit human validation (see Verification)
      started_at: · ended_at: · total: · check: · paths:

### Slice 2 — the work tile's next step wears green (amendment)

Surfaced mid-delivery, Human-directed 2026-11-11: `deckWorkSegments`
paints the trailing next-step `success` instead of `dim`
(packages/pi-stardeck/src/title-state.ts + its render-law test).
- [ ] `packages/pi-stardeck/src/title-state.ts`: the next-step segment
      `color: 'success'`; the hint comment follows
      started_at: · ended_at: · total: · check: · paths:
- [ ] `packages/pi-stardeck/test/title-state.test.ts`: the color-law row
      asserts `success:eospec approve`
      started_at: · ended_at: · total: · check: · paths:
- [ ] Commit `feat(deck): paint the work tile's next step green`
      started_at: · ended_at: · total: · check: · paths:
- [ ] Post-commit human validation (see Verification)
      started_at: · ended_at: · total: · check: · paths:

## Verification

Deterministic, nearest first: `npm run test:stardeck` ·
`npx prettier --check` on the four touched files · `npm run lint` ·
`npm run typecheck` · `npm run check:baseline` (after the confirmed
change passes: `node scripts/check-baseline.mjs --write`, rerun) ·
`npm run check:package:load` offline. The one human-only act: a live TUI
glance — with a warning active, the `⚠ …` line renders alone below the
INSERT prompt line, no dotted seam; with a clean room, nothing renders
below the prompt.

## History

—
