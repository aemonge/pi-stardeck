# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — One product name: @aemonge-dev/pi-stardeck, no CLI

> Execution: rename-product-to-pi-stardeck

- [x] Step 1 — Delete the CLI and its feeder (`bin/cockpit-agents.mjs`,
      `test/cockpit-agents.test.ts`, `packages/cockpit-telemetry/`, root bin
      field/files entry, `test:telemetry` links, `src/index.ts` registration,
      gate mentions) · check: typecheck green; `check:composition` PASS
      (1 extension, 8 commands, 4 tools) paths: `bin/`, `test/`, `packages/`,
      `package.json`, `src/index.ts`, `scripts/check-package.mjs`
- [x] Step 2 — Propagate the new identity (package name/version/image,
      channels, health command, descriptions, README/AGENTS/docs/licenses,
      component fixtures) · check: repo-wide grep finds zero
      `pi-vimux-starship`/`vimux`/`cockpit-agents`/`pi-agents` mentions
      outside openspec history, the lockfile, and three documented
      historical lines (AGENTS.md:10, AGENTS.md:69, docs/handoff.md:9)
      paths: `src/*.ts`, `packages/**`, `README.md`, `AGENTS.md`, `docs/*`,
      `licenses/README.md`, `justfile`
- [x] Step 3 — Rename assets and gates (tape + GIF renamed, tape
      re-choreographed without the npm-global/`pi-agents` beats,
      check-package assertions, refresh-demo-recording re-pointed) · check:
      `check:package` PASS (79 files, README/VHS PASS) paths:
      `demo/pi-stardeck.tape`, `docs/assets/pi-stardeck.gif`,
      `scripts/check-package.mjs`, `test/check-package.test.ts`,
      `openspec/changes/refresh-demo-recording/idea.md`
- [x] Step 4 — Baseline refresh + sandbox gates green + zero-mention grep ·
      check: `check:baseline` PASS (110 files, manifest UPDATED),
      `test:tooling` 24/24, `test:components` 544/544, typecheck green,
      `check:package:load` PASS (79 files, 3 model rows), `format:check`
      PASS, `lint` PASS, `check:openspec` PASS (5 changes) paths:
      `baseline/source.sha256`
- [ ] Step 5 — Human validation — host lockfile refresh, full `npm run check`,
      publish `0.5.0`, push, reinstall under the new name

  gate-attributed · tool: bash · paths: — · at 2026-10-15T07:23:05Z

  gate-attributed · tool: write · paths: /home/aemonge/.pi/agent/fancy-footer.json · at 2026-10-15T07:23:21Z

  gate-attributed · tool: bash · paths: — · at 2026-10-15T07:23:24Z
