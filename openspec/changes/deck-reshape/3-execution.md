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
