# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — z.ai QuotaProvider on the existing seam

> Execution: zai-quota-provider

- [x] Step 1 — Seam extension: `QuotaSnapshot.windows?`,
      `FooterTelemetryMessage.quotaWindows?`, `buildFooterTelemetryMessage`
      plumbing with finite 0–100 bounds; footer unit tests
      paths: `packages/footer/src/quota.ts`, `packages/footer/src/protocol.ts`,
      `packages/footer/src/telemetry.ts`, `packages/footer/test/quota.test.ts`
- [x] Step 2 — `quota-zai.ts`: auth.json key + `${ENV}` expansion,
      Bearer fetch, envelope normalization (TIME skip, percentage or
      currentValue/usage, reset sort, 5h/7d labels), fail-soft
      `snapshot()`; unit tests with synthetic envelopes
      paths: `packages/footer/src/quota-zai.ts`, `packages/footer/test/quota-zai.test.ts`
- [x] Step 3 — Cadence wiring: refresh on session start, model change,
      5-minute interval; snapshot caching between ticks; register id
      `zai` paths: `packages/footer/src/`
- [ ] Step 4 — Full sandbox gate battery + baseline refresh + graphify
      update · check: `npm run check` exit 0, `check-baseline --write`
      PASS, `graphify update .` clean paths: `baseline/source.sha256`
- [ ] Step 5 — Human validation — host gates with a real key (corner
      flame + countdown, line-4 `7d` calendar, no error spam), publish,
      reinstall

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/~/projects/pi-stardeck/packages/footer/src/quota.ts · at 2026-10-19T08:48:41Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/~/projects/pi-stardeck/packages/footer/src/protocol.ts · at 2026-10-19T08:49:00Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/~/projects/pi-stardeck/packages/footer/src/telemetry.ts · at 2026-10-19T08:49:12Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/~/projects/pi-stardeck/packages/footer/src/quota-zai.ts · at 2026-10-19T08:49:45Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/~/projects/pi-stardeck/packages/footer/src/quota-zai.ts · at 2026-10-19T08:50:32Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/~/projects/pi-stardeck/packages/footer/index.ts · at 2026-10-19T08:50:41Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/~/projects/pi-stardeck/packages/footer/test/telemetry.test.ts · at 2026-10-19T08:50:55Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/~/projects/pi-stardeck/packages/footer/test/quota-zai.test.ts · at 2026-10-19T08:51:26Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/~/projects/pi-stardeck/packages/footer/src/quota-zai.ts · at 2026-10-19T08:51:59Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/~/projects/pi-stardeck/packages/footer/test/quota-zai.test.ts · at 2026-10-19T08:52:25Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/~/projects/pi-stardeck/packages/footer/test/quota-zai.test.ts · at 2026-10-19T08:52:37Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/~/projects/pi-stardeck/packages/footer/src/quota-zai.ts · at 2026-10-19T08:53:29Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T08:58:19Z

  gate-attributed · tool: mem_save · paths: — · at 2026-10-19T08:59:23Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T09:03:21Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T09:05:26Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T09:07:40Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T09:07:48Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T09:08:20Z

  gate-attributed · tool: bash · paths: — · at 2026-10-19T09:08:36Z
