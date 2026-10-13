# Plan: Rename header to pi-stardeck

> Estimate: 45–90 min · confidence: high
> Evidence: two rename precedents landed cleanly (galactica-status→status,
> galactica-context-header→header); full reference map grepped 2026-10-13
> Parent idea: customize-pi-stardeck
> Human wait: lockfile refresh runs on the host (sandbox lockfile is
> read-only); final gates + push verified by the Human

## Acceptance

- `packages/pi-stardeck/` exists with package name `pi-stardeck`; the old
  `packages/header/` path is gone from the tree.
- Root `package.json` runs `test:stardeck` green; `scripts/check-package.mjs`
  required files list `packages/pi-stardeck/index.ts` and the packed-artifact
  check passes.
- `src/index.ts` and `packages/cockpit-telemetry/index.ts` reference the new
  path; `tsc --noEmit` green; docs (handoff, development, source-inventory,
  AGENTS, package README) mention only `pi-stardeck`.
- Baseline manifest refreshed to the renamed tree; full `npm run check` green
  (lockfile refreshed on host).
- Human-verified: gates green on the host and the rename commit pushed.

## Scope

The package directory, its `package.json` name field and README, the root
`test:header` script, `check-package.mjs` required files, the `src/index.ts`
import, the `cockpit-telemetry` reference, the `bin/cockpit-agents.mjs`
comment, all doc mentions, the baseline manifest refresh, and the host-side
lockfile refresh.

## Exclusions

Zero behavior or render change. No configuration surface, no theming (later
slices under the same idea). No standalone npm publication of `pi-stardeck`
(the registry name stays reserved). No layout or element relocation work —
paused by Human direction 2026-10-06.
