# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — z.ai QuotaProvider on the existing seam

> Execution: zai-quota-provider

- [ ] Step 1 — Seam extension: `QuotaSnapshot.windows?`,
      `FooterTelemetryMessage.quotaWindows?`, `buildFooterTelemetryMessage`
      plumbing with finite 0–100 bounds; footer unit tests
      paths: `packages/footer/src/quota.ts`, `packages/footer/src/protocol.ts`,
      `packages/footer/src/telemetry.ts`, `packages/footer/test/quota.test.ts`
- [ ] Step 2 — `quota-zai.ts`: auth.json key + `${ENV}` expansion,
      Bearer fetch, envelope normalization (TIME skip, percentage or
      currentValue/usage, reset sort, 5h/7d labels), fail-soft
      `snapshot()`; unit tests with synthetic envelopes
      paths: `packages/footer/src/quota-zai.ts`, `packages/footer/test/quota-zai.test.ts`
- [ ] Step 3 — Cadence wiring: refresh on session start, model change,
      5-minute interval; snapshot caching between ticks; register id
      `zai` paths: `packages/footer/src/`
- [ ] Step 4 — Full sandbox gate battery + baseline refresh + graphify
      update · check: `npm run check` exit 0, `check-baseline --write`
      PASS, `graphify update .` clean paths: `baseline/source.sha256`
- [ ] Step 5 — Human validation — host gates with a real key (corner
      flame + countdown, line-4 `7d` calendar, no error spam), publish,
      reinstall
