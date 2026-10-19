# Plan: Deck reshape — identity leads, corner merges, notices go real

## Scope

`packages/pi-stardeck` renderer only. No data changes; the zai quota
windows, native statuses, and telemetry all keep their sources.

## Current state (verified)

- `projectDeckLeft` builds line-1 left as `path ⟩ git`; the identity
  cluster rides the RIGHT corner via `deckCornerRight` (identity ⟩
  machine segments, yield ladder drops the tail right-to-left, identity
  never drops, path floor 20).
- `modelGroupLeft` owns line-4 left (`󰚩 model › thinking › weekly?`);
  line-4 right is the notice slot — `collectDeckNotices` ladder with a
  dim `healthy` placeholder when clean; machine readings never leave
  line 1 (deck-machine-corner lockstep).
- Rows: L1, ─, L2(clock/subject/work), ┈, L3(activity/turn), ┈, L4.

## Design decisions

1. **Identity leads** — line-1 left becomes `identity ⟩ path › git`.
   The identity cluster never drops (existing contract); below the path
   floor the git segment yields first, then the path truncates, then
   the identity separator drops to keep `identity path` at minimum.
2. **Engine joins the corner** — line-1 right becomes
   `model › thinking › weekly? ⟩ machine-corner`. The engine group
   leads the segment list; the yield ladder drops right-to-left across
   the WHOLE corner (cost first … model last) before the path yields
   below its floor.
3. **Line 4 becomes the status row** — renders only when
   `collectDeckNotices` is non-empty: dotted seam + the notice line.
   Clean deck = six rows ending at L3. The dim `healthy` placeholder
   and its tests are deleted. Machine-readings-never-leave-line-1 is
   now trivially true (they ARE line 1).
4. **Alert tile** keeps its seat beside the corner on line 1.

## Risks

- Line-1 width pressure roughly doubles (identity left + engine right).
  Mitigation: the yield ladder now spans the merged corner; at 79 and
  below the git segment and corner tail yield as before; pins re-set.
- Test churn is the bulk: every line-1 pin, all line-4/engine pins,
  mockups, notice-ladder tests, and the row-count contract (7 → 6/7).
