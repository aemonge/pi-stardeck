# Idea: Refresh the demo recording

The README and the npm page ship `docs/assets/pi-vimux-starship.gif` — a Sep 9
recording of the old launch flow, before `pi-agents` existed. The demo tape
(`demo/pi-vimux-starship.tape`) is already updated and gated; only the render
and review remain.

## Musts

- Render the GIF on the host: `vhs demo/pi-vimux-starship.tape`. The tape keeps
  the real npm cache attached, uses `@<time>` wait timeouts, once-mode board
  beat, a fixed self-cleaning demo home, and visible instant-match waits —
  five prior renders failed at the board beat with no visible input echo, and
  a probe tape was prepared to isolate VHS hidden-period input loss.
- Human review: the GIF matches the recorded flow; original response, canonical
  outcome, and UTC recorded in the plan-stage ledger when this idea becomes a
  slice.

## Boundaries

- Tape content is frozen (gates pinned to it); this slice renders and reviews,
  it does not re-choreograph.
- Host-only work: VHS renders on the Human's machine, not in the sandbox.

## Value

The public demo finally shows the current cockpit — including a working
`pi-agents` — instead of a recording of a flow that no longer exists.

Carried over from `archive/2026-10-13-publish-pi-vimux-starship` (open `[-]`
and `[ ]` steps) on 2026-10-13; nothing dropped.
