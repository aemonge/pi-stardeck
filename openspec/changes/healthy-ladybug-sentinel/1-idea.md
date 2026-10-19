# Idea: Healthy ladybug sentinel in the status slot

> Human-directed 2026-10-19 after reviewing the live deck ("The status
> looks really empty… can we put the ladybug when no status is to be
> displayed in bottom right?"). Reverses the retirement recorded in
> deck-reshape's swap amendment ("the dim placeholder stays retired").

As the package maintainer I want the status row's right end to always
speak — `⚠ …` when the notice ladder has something to say, a quiet dim
ladybug `󰠭` when everything is healthy — so the bottom-right corner
never reads as a void.

- The glyph is the deck's signature ladybug (`\u{F082D}`), already the
  line-2 clock anchor and the footer avatar tail.
- It is a **reserved** glyph: `safeText` strips `󰠭` from every published
  status text, so no companion can forge it and it can never collide
  with a real notice.
- Rendered dim (quiet sentinel, not an attention draw) — confirmed with
  the Human before implementing.
