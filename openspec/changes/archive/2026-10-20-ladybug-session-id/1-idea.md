# Idea: Ladybug sentinel carries the short session id

> Human-directed 2026-10-20 right after validating the pi-goal-x
> retirement: "after the ladybug, can we have the short session ID of
> pi? to easily track and restore (only when no status). Like
> :lady_bug: :short_id: :lady_bug: and in blue purple <3".

As the package maintainer I want the deck's quiet sentinel to carry
this session's short id — `󰠭 01a157fd 󰠭`, blue bugs and a purple id
in the maintainer's theme — so any clean frame doubles as a
track-and-restore handle for the running Pi session, without spending
a notice or a status cell while work is being reported.

- Only when the notice ladder is silent: with notices the `⚠` slot
  keeps its full width and the id simply stays out of the row.
- The id is the deck's own `ctx.sessionManager.getSessionId()`
  (UUIDv7), git-style first 8 chars; purely local to the deck
  extension — no wire-contract change.
