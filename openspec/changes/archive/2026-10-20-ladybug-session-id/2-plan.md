# Plan: Ladybug sentinel carries the short session id

## Scope

Deck-side only, `packages/pi-stardeck`, plus one living-spec amendment.
No packages/status or wire changes.

## Current state (verified)

- `noticeTile` (deck.ts ~555-567) returns the dim ladybug `󰠭` when
  `collectDeckNotices` is empty; `renderHeaderDeck` computes
  `statusRight = noticeTile(state, theme)` and the machine ladder
  yields via `boundedWidth - visibleWidth(statusRight) - 1`.
- `pi.on('session_start', …)` (index.ts ~486) captures `ctx`;
  `ctx.sessionManager.getSessionId()` exists on ReadonlySessionManager.
  Session ids are UUIDv7 (`01a157fd-382e-…` per the session store).
- Maintainer theme: `accent` = #076678 (blue), `thinkingHigh` → purple
  (#b16286). The user asked for "blue purple".
- The reserved-glyph story: `safeText` strips `󰠭` from published
  texts; census tests count exactly two ladybugs when clean (clock
  anchor + footer avatar tail) with fixtures carrying no session id.

## Design decisions

1. **Capture** — index.ts `session_start`: `sessionShortId =
   shortSessionId(ctx)` = first 8 chars of `getSessionId()`, kept only
   when `/^[0-9a-f]{8}$/u` matches; stored beside the other per-session
   deck facts and threaded into the `renderHeaderDeck` state as
   `sessionShortId?: string`.
2. **Render** — `noticeTile(state, theme, width)`: notices empty +
   id present + `width >= 24` → `accent` ladybugs with a
   `thinkingHigh` id: `󰠭 01a157fd 󰠭` (12 cells). No id or narrow
   frame → today's dim single ladybug, so every existing sentinel
   assertion, the reserved-glyph guarantee, and the census stay true.
   Default color split (blue bugs, purple id) sits behind one constant
   pair; uniform purple is a one-line flip if the Human prefers a
   single tone at validation.
3. **Spec honesty** — amend the deck-title-state notice-slot
   requirement's clean scenario (currently "renders nothing when
   clean", already superseded by the sentinel) to describe the actual
   clean render: dim ladybug sentinel, wearing the short session id
   when known. Archive/ untouched.
4. **Tests** — new deck tests: cluster string + colors with
   `sessionShortId` set; omit-without-id; narrow-frame degrade; census
   becomes three ladybugs when clean with an id (clock anchor + two
   cluster bugs).
   Existing tests untouched (no fixture carries an id).

## Verification

`npm run check` in packages/pi-stardeck; root `npm run check`;
reviewer pass; Human visual validation via `pi install "$(pwd -P)"`
(same dogfood path as the goal retirement).
