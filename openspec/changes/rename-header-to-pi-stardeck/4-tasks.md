# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Task 1 — The package lives as pi-stardeck

> Execution: rename-header-to-pi-stardeck

- [x] Step 1 — Move the package and rename its identity (directory,
      `package.json` name, README) start: 2026-10-13T09:14:48Z · elapsed: ~3m
      · check: `npm --prefix packages/pi-stardeck test` green (107/107) paths:
      `packages/pi-stardeck/**`
- [x] Step 2 — Propagate every reference (root script, check-package required
      files, src import, cockpit-telemetry comment, bin comment, docs) start:
      2026-10-13T09:17:30Z · elapsed: ~4m · check: grep finds zero
      `packages/header` mentions outside openspec history paths · prettier
      check green after table realign paths: `package.json`,
      `scripts/check-package.mjs`, `src/index.ts`,
      `packages/cockpit-telemetry/index.ts`, `bin/cockpit-agents.mjs`,
      `docs/*`, `AGENTS.md`
- [x] Step 3 — Refresh gates and manifests (baseline `--write`, full sandbox
      gate list) start: 2026-10-13T09:21:00Z · elapsed: ~3m · check:
      `check:baseline` PASS (109 files), `check:package` PASS (78 files),
      `tsc --noEmit` green, `check:openspec` PASS (4 changes),
      `test:stardeck` green (107/107) paths: `baseline/source.sha256`
- [x] Step 4 — Human validation — host lockfile refresh, full `npm run check`
      exit 0, push outcome: VALID · at: 2026-10-13T18:47Z · settle commit
      `94f28c7` — fused tree landed, main in sync with origin at `94f28c7`;
      lockfile carries `pi-stardeck` workspace with zero `packages/header`
      references

> **RESOLVED 2026-10-13 (settle commit `94f28c7`).** The remote fork was
> settled by adopting the spec-driven openspec schema (direction A);
> our plan-era changes are preserved under `openspec.old/` with a
> `.prettierignore` exemption. All rename steps `[x]`; gates green; push
> complete.
>
> **Follow-ups (2026-10-14).** Origin swapped to
> `git@github.com:aemonge/pi-stardeck.git`; branch tracking is unset, so the
> first push needs `git push -u origin main`. Release `0.3.0` carrying the
> rename is still pending (package.json at 0.2.1).
