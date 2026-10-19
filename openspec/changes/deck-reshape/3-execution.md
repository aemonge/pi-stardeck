# Execution: Deck reshape

## Log

- 2026-10-19: Change opened after the icon family settled — Human
  mock accepted verbatim in the idea. Implemented in one pass:
  identity cluster moved to line-1 LEFT (`identity ⟩ path › git`,
  projectDeckLeft now takes the cluster; truncation eats git then path,
  identity last); the engine group (model › thinking › weekly?) merged
  into the line-1 corner ahead of the machine tail (deckCornerRight
  rebuilt around modelGroupLeft; yield ladder spans the merged corner —
  machine tail drops right-to-left, engine group outlasts it, corner
  empties entirely at ~39); line 4 retired as an engine row — the
  bottom row is now the STATUS row, rendered (with its dotted seam)
  only when collectDeckNotices speaks; the dim `healthy` placeholder
  and telemetryRowLeft deleted. Clean deck = five rows.
  Test re-baseline: ~30 pins moved (row counts 7→5/7, notice-row
  locator = last row, engine assertions moved to line 1, yield
  boundaries re-pinned — full corner at 100, engine+calendar+cpu at 60,
  engine+calendar at 62 in the flame state, identity-only at 14/9 with
  the alert compacting to its worst count). Alert tile: at width 9 the
  corner can now empty, so the alert survives compacted (`󰅙 5`) —
  pinned as the new contract. 68 deck tests; full battery exit 0.
  .openspec.yaml gotcha repeated (scaffold lacked schema) — fixed.
- 2026-10-19 (post-approval fixes): (1) Left-edge alignment — the
  activity row's leading space is gone; every left edge sits at column 0
  (lines 1/2/3 and the status row). (2) Sibling fix in
  zai-quota-provider: the LIVE envelope (probed with the real key,
  masked) reports nextResetTime in MILLISECONDS — normalizeZaiEnvelope
  converts anything above 1e11 to seconds; live snapshot now reads
  5h 36% + 7d 7%, which lights the corner flame and the 7d calendar on
  restart. Battery exit 0 (19 gates), footer 11/11, deck 68/68.
- 2026-10-19 (same-day amendment, live review): the merged corner
  overloaded line 1 — the engine group (model › thinking › weekly) moved
  BACK to a bottom row's left end, status right-aligned on the same row
  (present only when the ladder speaks; the dim placeholder stays
  retired). Line 1 right is machine-only again; the machine-only corner
  is compact — the full tail fits at 79, only cost yields at 60, and at
  62 in the flame state the flame+countdown+cpu+mem+mcp all ride.
  Kept from the reshape: identity leads line 1 left, flush left edges,
  real conditional status, no placeholder. 68 tests, battery exit 0.
- 2026-10-19 (swap amendment): top-right and bottom-left SWAPPED — the
  short, predictable engine group (`󰚩 model › thinking › 󰃰 weekly`)
  rides line 1 right (fits beside the path floor or yields wholesale),
  and the long machine tail anchors the bottom row's left end, yielding
  right-to-left into whatever width the status leaves. Rationale
  (Human): PWD and branch grow unpredictably — they must never fight the
  machine tail for line-1 width. Machine corner ladder preserved as
  machineCornerLadder for the bottom row. 68 tests, battery exit 0.
- 2026-10-19 (gold polish): (1) The weekly calendar carries its window
  label — `󰃰 7d 10%` (labels were rendered percent-only). (2) The
  machine tail renders GROUPED with big separators between groups and
  minor inside: quota (flame › countdown) ⟩ process (cpu › mem › mcp) ⟩
  context (ctx › sums) ⟫ cost; machineCornerSegments now returns
  groups and the ladder yields per group. 68 tests, battery exit 0.
