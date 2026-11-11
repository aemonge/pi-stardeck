# Brainstorm

> Spec: move-warning-below-prompt · consult `openspec/learnings/` before
> drafting (absent)

## Pain

The deck's aggregated notice line — `⚠ graphify active · report available ·
update recommended` (`collectDeckNotices` → `warningLine` in
`packages/pi-stardeck/src/deck.ts`) — renders inside the above-editor
widget as the deck's last row, directly on top of the prompt surface.
Everything else the deck says is identity or telemetry; the warning is a
call to act, and it currently sits far from where the Human's eyes land
when acting: the editor. Human layout direction 2026-11-11 (mockups
"from"/"to"): all telemetry stays above the prompt, but the warning makes
more sense below it — a standalone line under the editor prompt, no dotted
seam, silent when clean.

## Questions

- Clean sessions must render nothing new below the prompt — confirm the
  silent-when-clean law carries over unchanged (widget content, not just
  the line, disappears)?
- The embedded `editor-deck` surface shares `renderHeaderDeck` with the
  default widget: the warning leaves the embedded deck too, and that
  surface's contract (zero widget registration — asserted by
  `surface.test.ts`) stays untouched, so embedded mode temporarily loses
  the warning until an embedder asks for it below. Acceptable, or should
  the embedder contract grow a below slot now?
- Severity styling: blocked notices currently render the line at error
  red vs warning yellow — same color rule on the below-prompt line,
  unchanged?

## Direction

`renderHeaderDeck` drops its warning tail (the `[dottedRule, warning]`
spread); a new `renderWarningLine(state, width, theme)` export owns the
single `⚠ …` line, reusing `collectDeckNotices` unchanged. The default
deck surface registers a second widget keyed `galactica.deck-warning` with
`placement: 'belowEditor'` (pi core supports it —
`/usr/lib/pi/examples/extensions/widget-placement.ts`), fed by the same
live state, cleared together with the deck widget on session re-entry and
shutdown. Tests flip: deck tests assert the deck ends on the machine row
with no ⚠, and the new render owns the line; the wiring test asserts both
registrations and their placements.
