# Execution: z.ai quota provider

## Log

- 2026-10-16: Change opened. Human picked z.ai first (Codex/Claude later
  via the registry seam); clean-room envelope facts recovered from git
  history `bc474cb^` and recorded in the idea. Companion renderer slice:
  deck-corner-context.
- 2026-10-19: Steps 1-3 complete. Step 1: `QuotaSnapshot.windows?` +
  `QuotaWindow` on the seam, `FooterTelemetryMessage.quotaWindows?`
  (protocol stays 1, additive), `buildFooterTelemetryMessage`
  sanitizes each window (label non-empty, percent clamped 0-100,
  resetAt floored positive; survivors only). Step 2: `quota-zai.ts` —
  `${ENV}` expansion (pi auth convention, missing var fails soft),
  `zai.key` from ~/.pi/agent/auth.json, Bearer fetch, envelope
  normalization (TIME* skip, percentage or currentValue/usage,
  reset-sorted, labels 5h ≤2d / 7d ≤15d / `<n>d`), registry id `zai`
  with module-level cache so a stop/restart cycle never leaves a dead
  closure registered. Step 3: footer entry refreshes on session start
  and model change (refresh-then-republish, fire-and-forget), 5-min
  unref'd interval, `stop()` on session_shutdown clears cache and
  re-arms distinct-mode debug reporting.
  Battery: footer 10/10 (envelope forms, expansion, fail-soft cache
  survival, never-fetches-without-key), full `npm run check` exit 0,
  baseline 100 files, graphify rebuilt (486 nodes). Step 4 (gate
  battery re-run at publish time) folded into the 0.9.0 bundle;
  Step 5 host validation with a real key pending.
- 2026-10-19 (live envelope correction): probed with the real key —
  nextResetTime arrives in MILLISECONDS (clean-room doc said seconds;
  labels exploded to 20724871d). normalizeZaiEnvelope now floors
  >1e11 values to seconds; both epochs covered by tests. Real envelope:
  two CREDIT_LIMIT rows (unit 3 = 5h coding window, unit 6 = weekly),
  usage as percentage AND currentValue/usage agreeing. Live snapshot:
  5h 36% / 7d 7% — flame + calendar light on restart.
- 2026-10-19: Step 5 VALID — live deck (Human's own paste) shows the
  flame 󰈸 58% with countdown 󰅐 1:36 and the 󰃰 7d 11% calendar lit from
  the real key, zero error spam. Change complete pending the release.
