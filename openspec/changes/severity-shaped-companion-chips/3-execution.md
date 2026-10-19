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
