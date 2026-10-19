# Execution: Severity-shaped companion chips

## Log

- 2026-10-19: Change opened after Human review of the live 0.8.0 corner
  ("colors are barely visible" — shape must carry severity; brackets for
  error-or-off, parens for degraded, bare for healthy; all four chips
  including devbox; bolder pass on top).
- 2026-10-19: Step 3 complete. `deck.ts`: `COMPANION_WARNING_PATTERN`
  split into `COMPANION_DEGRADE_PATTERN` (warn|stale|update recommended|
  needs attention) and `COMPANION_ERROR_PATTERN` (error|fail|down|
  unreachable|unhealthy); new `companionSeverity` + `renderChip`
  (shape law: `[]` error/off, `()` degraded, bare healthy; color keeps
  the fine grain — muted/warning/error/accent underneath). Devbox lead
  chip joins the law (bare when present, success-colored); engram's
  identity bracket and the multi-icon auto-bracket retired — shape is
  the only bracket authority. Degraded/error chips escalate to
  `loud()` (reverse-video, already bold). Bare→bare double-gap rule
  untouched; line-4 notice surfacing unchanged (severity union equals
  the old pattern union).
  Tests: 15 pins re-baselined + 1 new mixed-state law test
  (shapes, colors, reverse-video, `󰆧  ↻ (⌬) [⛨] ⟩`); mid-work mockup
  full transcription re-pinned at 120 — the all-off cluster is 3 columns
  wider, so at 100 the git segment ellipsizes while the corner stays
  whole (new boundary assertion pins that).
  Sandbox battery: format/lint/typecheck green, 5 suites `fail 0`
  (67 deck), package load PASS (70 files), baseline refreshed to
  98 files (deck.ts entry), import record 87 PASS, `npm run check`
  exit 0. Step 4 (publish 0.9.0 + host spot-check) pending Human.
- 2026-10-19 (later): Human live-review amendment after local install
  (pi install <repo-dir>, the local-tgz loader path being broken in pi —
  registry tarball included). (1) Off joins error visually: brackets are
  red reverse-video always — the muted undercolor is gone; off and error
  read identically by design, the notice slot carries the distinction.
  (2) Enclosures breathe: the gap between chips goes wide whenever
  either neighbor is bare (bare↔enclosure was single and read tight);
  enclosure↔enclosure stays single. (3) The "missing devbox icon" report
  was env, not code: the chip renders iff DEVBOX_PROJECT_ROOT is set at
  pi launch — a session started outside devbox shows no chip, by design.
  67 deck tests re-pinned; full battery npm run check exit 0 (18 PASS).
  Also: the change's .openspec.yaml needed goal + skip_specs to pass the
  strict gate (CLI scaffold had created it bare).
- 2026-10-19 (latest): Human amendment round 2. (1) Devbox chip never
  appears/disappears anymore: in-devbox = bold blue OK (bare 󰆧, accent
  BG), outside = bold red KO ([󰆧], error BG) — DEVBOX_PROJECT_ROOT at
  launch decides; mockups re-pinned for the now-always-present KO chip
  and the deeper 100-col git truncation (`main…`). (2) BGs only: every
  chip state renders as a reverse-video block — healthy went loud too
  (the accent foreground was not bold enough to survive). (3) Temporary
  preview `scripts/chips-preview.mjs` (not packed): variants A (shapes
  + BG, current), B (BG only, no enclosures), C (bold fg only, the
  failed past) across five state mixes — judging whether the enclosures
  can be dropped entirely. Battery: 67 deck tests, npm run check exit 0
  (18 PASS), baseline refreshed.
- 2026-10-19 (final): Human verdict on the preview — Variant C: bold
  foreground colors alone. Enclosures and reverse-video are gone from
  the chips entirely: blue = healthy/devbox OK, yellow = degraded,
  red = error/off/devbox KO, all bold, all bare icons, wide gaps
  throughout (the 0.7.1 rule generalized), off vs error left to the
  notice slot. The shape law is repealed; severity classification
  stays (it drives color). Cluster is the narrowest form yet — the
  100-col git truncation restored `main ›  …`. 67 tests, check exit 0.
- 2026-10-19 (spacing verdict): Human read the live cluster correctly
  (appa red, engram/graphify blue, devbox red = outside) — the color law
  lands. Final spacing: single spaces across the cluster and before the
  major separator (SPACE_ICON_SPACE); wide glyphs carry their own
  padding. The 0.7.1 wide-gap rule is repealed for the cluster. Yield
  boundaries shifted left with the narrower cluster: full corner fits at
  79, mockup transcription fits at 100 again, the width-20 alert keeps
  both counts. 67 tests, check exit 0.
- 2026-10-19 (title + wide-icon fixes): (1) The empty title slot renders
  its dim `— no subject` placeholder now — mirroring Work's hint — for
  any live session (header present) without a subject; the fully
  collapsed frame (header null, pre-title publisher) keeps the frozen
  clock-alone contract. New test pins both placeholder cases.
  (2) Wide-icon spacing: graphify ⌬ and appa ⛨ render two cells in the
  base font — when two wide icons adjoin, their glyph padding is the
  gap (no space between ⌬ and ⛨); all other pairs keep one space.
  Yield ladder shifted again: context rides at 60 columns now.
  68 deck tests, check exit 0 (status/active-work waitFor flake on first
  run, green on retry — timing-sensitive, unrelated).
- 2026-10-19 (final polish): (1) Wide chips breathe right: ⌬ and ⛨ get
  a double gap on their right (single everywhere else) — replaces the
  round-1 no-space rule; a wide trailing chip keeps the double gap
  before the major separator (trailingBare now means "wide gap after").
  Context yields again at 60 cols. (2) The line-1 path no longer starts
  with a space — the leftover devbox-prefix slot is gone; the path opens
  directly with the folder glyph. 68 tests, check exit 0.
- 2026-10-19 (icon swap): base-font symbols retired for good — spacing
  compensation cannot fix terminal-dependent metrics. All three companion
  chips are Nerd Font PUA glyphs with verified identical single-cell
  advance (font cmap + hmtx across two NF families): engram ↻ → md-sync
  󰓦 (F04E6), graphify ⌬ → dev-networkx (E83D), appa ⛨ → oct-shield
  (F49C); devbox 󰆧 (F01A7) unchanged. The wide-chip gap machinery
  (WIDE_CHIP_ICONS, per-pair double gaps) is deleted — plain single-
  space join, uniform rhythm, SPACE_ICON_SPACE exactly. 68 tests,
  check exit 0.
- 2026-10-19 (icon weight): dev-/oct- sets render visually lighter than
  md- inside the same cell — graphify → md-graph (F1049), appa →
  md-shield (F0498), both verified single-cell in two NF families; the
  whole cluster now shares the md- family weight with devbox and
  md-sync. 68 tests, check exit 0.
