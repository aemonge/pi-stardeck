# Brainstorm

> Spec: simplify-deck-band · consult `openspec/learnings/` before drafting
> (no `openspec/learnings/` directory exists yet — nothing consulted)

## Pain

During any tool run the deck band shows several unlabeled ticking clocks at once —
the turn chronometer (`002:43'22 · 222.2k`), the per-span elapsed rows
(`└ (01'23) bash working`), and Pi core's own transcript durations (`▸ Ran … (1.8s)`)
— and none of them says what it measures, so at a glance they read as accidental
duplication rather than information. The clock the Human actually needs when a
process may be hung (the per-command elapsed) is the least prominent: dim,
smallest, buried after a branch glyph. Meanwhile the band spends most of its
width on telemetry the Human never reads — model/thinking/quota
(`󰚩 GLM-5.3-Flash › high ⟩ 󰃰 7d 30%`) and resources/cost
(`󰈸 2% › 󰅐 4:12 ⟩ 󰍛 0.1% › 󰘚 149M ⟩ 󰾆 4% ⟩ 󰜦 $0.03`) — because the paid
subscription makes quota and cost noise in daily use.

## Questions

1. Which clocks retire — only the turn chronometer, or also the per-span
   `└ (mm'ss) …` rows, leaving the deck fully clock-free (Human's stated
   direction: remove timers *and therefore* the sub-bash/sub-process lines)?
2. Does `pi-run-timestamps` (pi.dev) exist and behave as hoped — does it stamp
   start times, durations, or both — and does it collide with Pi core's own
   `▸ … (1.8s)` duration rendering on the same transcript lines?
3. If that external package proves unsuitable or unverifiable, is a clock-free
   deck still acceptable on its own, or does a minimal fallback remain in scope?
4. Which telemetry tiles survive the rethink (model, thinking effort,
   coding-window quota + reset countdown, long-horizon quota, CPU, memory, load,
   cost), and in what simpler form — fewer tiles, appear-only-when-notable
   thresholds, or a single compact ambient group?
5. What must stay always-visible — the Human demonstrably reads context tokens
   (`222.2k`) and the subject/work lines; what else, if anything, is load-bearing?
6. Which standing Human amendments does this change supersede — "the deck's
   only timer" (`turnCostTile` comment), the ticking-chronometer-as-liveness
   amendment, and the quiet-activity-row `— · 0 tok` idle placeholder?
7. Scope of deletion: does removing span clocks also retire the status package's
   span publication (`activeRunSpans` / `runtime-runs.ts`), or only the deck's
   rendering of it?

> Direction: the band should show only what the Human reads mid-flight — subject
> and work stay, both clock families go, and the time story moves to the
> workspace where each run is stamped inline (external `pi-run-timestamps`, to be
> verified). Telemetry shrinks toward a near-silent cluster; quota and cost,
> irrelevant under the subscription, demote to appear-only-when-notable or leave
> the band entirely. The result is a quieter cockpit whose every remaining pixel
> is read daily.
