# Investigate

> Spec: move-warning-below-prompt · aim at the Brainstorm's Questions ·
> read-only preflight 2026-11-11

## Findings

- **The warning tail is exactly two rows.** `renderHeaderDeck`
  (`packages/pi-stardeck/src/deck.ts:721`) ends with
  `...(warning.trim() !== '' ? [dottedRule, warning] : [])` (deck.ts:798).
  `warningLine` (deck.ts:515) composes `\u26a0 ${notices.join(' · ')}` from
  `collectDeckNotices` (deck.ts:499) — blocked notice, approval notice,
  companion warning texts, diagnostics count, minus the title waiver.
  Severity is one ternary: `notices.includes(BLOCKED_NOTICE) ? 'error' :
  'warning'` (deck.ts:523). Everything the line says lives behind
  `collectDeckNotices`; the row itself carries no other state. Extraction
  is clean: a `renderWarningLine(state, width, theme)` returning `[]` or
  `[warning]` needs nothing else.
- **pi core owns the below-editor slot.** `ctx.ui.setWidget(key, factory,
  { placement })` accepts `'aboveEditor'` (default) and `'belowEditor'`;
  pi's shipped example `/usr/lib/pi/examples/extensions/widget-placement.ts`
  registers one of each in a single `session_start`. Docs note the same in
  `/usr/lib/pi/docs/rpc-extension-ui.md` (`widgetPlacement` is
  `"aboveEditor"` (default) or `"belowEditor"`). No factory-shape change:
  the component contract (`render(width)`, `invalidate()`) is identical
  for both placements.
- **The current registration rides one lifecycle.** `galacticaContextHeader`
  (`packages/pi-stardeck/index.ts:131`) registers `galactica.work-identity`
  with `{ placement: 'aboveEditor' }` (index.ts:454–465) only when
  `surface` is the default `'deck'`; `clearWidget` tears it down on
  `session_start` re-entry (index.ts:404) and `session_shutdown`
  (index.ts:507). A second key (`galactica.deck-warning`) cloned beside it
  shares the same closure state (`header`, `piStatus`, `gitStatus`, …) and
  the same `requestRender` chain — no new event wiring; every existing
  `requestRender?.()` call site drives both widgets.
- **Editor-deck mode asserts zero registration.** The `editor-deck`
  branch returns before any `setWidget` (index.ts:444–451), and
  `surface.test.ts:72` ("editor-deck publishes a renderer without
  registering an above-editor widget") fails on ANY `setWidget` call
  (surface.test.ts:120). Brainstorm Q2's default (embedded mode
  temporarily loses the warning; no contract growth) is therefore the
  zero-code path — growing a below slot now would touch the
  pi-vim-top-border embedder contract for a surface nothing in the
  runtime cockpit uses (pi loads extensions without options; only tests
  compose `editor-deck`).
- **Test blast radius.** deck.test.ts:1613–1645 ("line 4 right is
  notice-only…") and deck.test.ts:1832–1866 ("a bare deck closes…")
  assert the warning as `lines.at(-1)` with the dotted seam at
  `at(-2)` — both flip to assert absence from `renderHeaderDeck` and
  presence in the new render. The narrow-width yield (deck.test.ts
  ~1598) rides `warningLine`'s notices, unchanged. The default deck
  mode's `setWidget` wiring is currently untested (surface.test.ts only
  covers `installEmptyDeckFooter` and `editor-deck`) — the
  above/below placement assertions are a new wiring test, not a flip.
- **Silence law survives the move.** The dynamic-line rule
  ("reorder-deck-frame", Human-directed 2026-11-11, deck.ts:516–519) —
  nothing renders when there is nothing to say — transfers to the widget:
  empty notices render `[]`, and pi treats an empty render as no
  content; the widget key stays registered but speaks nothing, matching
  today's behavior for the line.

## Answers to the Brainstorm's Questions

1. **Silent-when-clean** — yes; `renderWarningLine` returns `[]` when
   `collectDeckNotices` is empty; the below-editor widget renders no
   rows, same silence contract as today's line.
2. **Editor-deck contract** — stays untouched; the embedded deck loses
   the warning row until an embedder asks for a below slot (runtime
   cockpit never composes `editor-deck`; only the test harness does).
3. **Severity colors** — unchanged ternary, relocated with the line.
