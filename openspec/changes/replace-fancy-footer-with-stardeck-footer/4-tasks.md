# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — Clean-room footer telemetry provider, old module deleted

> Execution: replace-fancy-footer-with-stardeck-footer

- [x] Step 1 — Author `packages/footer` with usage walk, snapshot publishing,
      quota seam, and parity tests against the deck parser · check: 14/14
      tests green, `tsc --noEmit` green paths: `packages/footer/**`
- [x] Step 2 — Swap composition and command lists; focused tests green ·
      check: `test:tooling` 24/24, `test:footer` 14/14, deck tests 149/149,
      `check:composition` PASS (1 extension, 7 commands, 4 tools) paths:
      `src/index.ts`, `package.json`, `src/health.ts`,
      `test/local-load-probe.test.ts`, `test/health.test.ts`
- [x] Step 3 — Delete the old module and license; propagate docs and gates;
      zero-mention grep (amended acceptance) · check: scoped grep finds only
      intentional live-wire notes and historical docs paths:
      `packages/pi-fancy-footer-full-palette/` (deleted),
      `licenses/pi-fancy-footer-LICENSE` (deleted), `README.md`, `AGENTS.md`,
      `licenses/README.md`, `scripts/check-package.mjs`, `docs/*`,
      `packages/pi-stardeck/README.md`, `packages/status/package.json`
- [x] Step 4 — Baseline refresh + full sandbox gate battery + graphify update
      · check: `check-baseline --write` PASS (98 files, import record 87),
      `npm run check` exit 0 — tooling 24/24, deck 186/186 + 149/149, footer
      14/14, vim 37/37, composition PASS (1 extension, 7 commands, 4 tools),
      OpenSpec 7/7; `graphify update .` clean (needs_update cleared) · paths:
      `baseline/source.sha256`
- [ ] Step 5 — Human validation — host gates, `just publish 0.6.0`, push,
      reinstall, deck-row spot check

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:22:10Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/footer/src/protocol.ts · at 2026-10-15T08:22:52Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/footer/src/telemetry.ts · at 2026-10-15T08:23:14Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/footer/src/quota.ts · at 2026-10-15T08:23:24Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/footer/index.ts · at 2026-10-15T08:23:35Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/footer/package.json · at 2026-10-15T08:23:45Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/footer/tsconfig.json · at 2026-10-15T08:24:01Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/footer/README.md · at 2026-10-15T08:24:12Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/footer/test/telemetry.test.ts · at 2026-10-15T08:24:39Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/footer/test/quota.test.ts · at 2026-10-15T08:24:45Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/footer/test/parity.test.ts · at 2026-10-15T08:25:26Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/footer/test/events.test.ts · at 2026-10-15T08:25:45Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/footer/test/.prettierignore · at 2026-10-15T08:25:57Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:26:10Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:26:20Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:26:25Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:26:30Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/src/index.ts · at 2026-10-15T08:26:56Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:27:07Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/src/health.ts · at 2026-10-15T08:27:14Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/test/local-load-probe.test.ts · at 2026-10-15T08:27:24Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:27:32Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:27:41Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/test/local-load-probe.test.ts · at 2026-10-15T08:28:11Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:28:17Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:28:35Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/scripts/check-package.mjs · at 2026-10-15T08:30:39Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/README.md · at 2026-10-15T08:30:46Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/README.md · at 2026-10-15T08:31:12Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/licenses/README.md · at 2026-10-15T08:31:26Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/AGENTS.md · at 2026-10-15T08:31:38Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:31:53Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/README.md · at 2026-10-15T08:32:38Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:32:53Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/test/health.test.ts · at 2026-10-15T08:33:01Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/test/local-load-probe.test.ts · at 2026-10-15T08:33:08Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:33:19Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/footer/src/quota.ts · at 2026-10-15T08:33:24Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:34:09Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:38:43Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/RESUME.md · at 2026-10-15T08:40:27Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:40:32Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:40:42Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T08:41:28Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T13:18:43Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T13:20:11Z

  gate-attributed · tool: mem_save · paths: — · at 2026-10-15T13:23:13Z
