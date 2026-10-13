# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — The package lives as pi-stardeck

> Execution: rename-header-to-pi-stardeck

- [ ] Step 1 — Move the package and rename its identity (directory,
      `package.json` name, README) start: <!-- UTC --> · elapsed: <!-- e.g. 3m -->
      · check: `npm --prefix packages/pi-stardeck test` green paths:
      `packages/pi-stardeck/**`
- [ ] Step 2 — Propagate every reference (root script, check-package required
      files, src import, cockpit-telemetry comment, bin comment, docs) start:
      <!-- UTC --> · elapsed: <!-- e.g. 8m --> · check: grep finds zero
      `packages/header` mentions outside openspec history paths:
      `package.json`, `scripts/check-package.mjs`, `src/index.ts`,
      `packages/cockpit-telemetry/index.ts`, `bin/cockpit-agents.mjs`,
      `docs/*`, `AGENTS.md`
- [ ] Step 3 — Refresh gates and manifests (baseline `--write`, full sandbox
      gate list) start: <!-- UTC --> · elapsed: <!-- e.g. 4m --> · check:
      `check:baseline` PASS, `check:package` PASS, `tsc --noEmit` green,
      `check:openspec` PASS paths: `baseline/source.sha256`
- [ ] Step 4 — Human validation — host lockfile refresh, full `npm run check`
      exit 0, push response: <!-- original reply --> · outcome: VALID · at:
      <!-- UTC -->
