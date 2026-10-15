# Idea: Refresh the demo recording

> Re-pointed 2026-10-15 by `rename-product-to-pi-stardeck`: the tape is now
> `demo/pi-stardeck.tape`, renders `docs/assets/pi-stardeck.gif`, installs
> `@aemonge-dev/pi-stardeck`, and no longer choreographs the removed
> `pi-agents` CLI. The frozen-tape boundary of this idea was superseded by
> that rename slice; only the render and review remain here.

The README and the npm page ship `docs/assets/pi-stardeck.gif` — a Sep 9
recording of the old launch flow, before the CLI was removed. The demo tape
(`demo/pi-stardeck.tape`) is already updated and gated; only the render and
review remain.

## Musts

- Render the GIF on the host: `vhs demo/pi-stardeck.tape`. The tape keeps
  the real npm cache attached, uses `@<time>` wait timeouts, a fixed
  self-cleaning demo home, and visible instant-match waits — five prior
  renders failed at the board beat with no visible input echo, and a probe
  tape was prepared to isolate VHS hidden-period input loss.
- Human review: the GIF matches the recorded flow; original response, canonical
  outcome, and UTC recorded in the plan-stage ledger when this idea becomes
  a slice.

## Boundaries

- Tape content is gated by `scripts/check-package.mjs`; this slice renders
  and reviews, it does not re-choreograph.
- Host-only work: VHS renders on the Human's machine, not in the sandbox.

## Value

The public demo finally shows the current pi-stardeck cockpit instead of a
recording of a flow that no longer exists.

Carried over from `archive/2026-10-13-publish-pi-vimux-starship` (open `[-]`
and `[ ]` steps) on 2026-10-13; nothing dropped.
