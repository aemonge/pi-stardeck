# Execution: Rename product to pi-stardeck, retire the CLI

> Estimate: 60–120 min (from plan) · Human wait: host lockfile refresh, full
> gates, publish, push · Parent idea: customize-pi-stardeck

## Skills

TypeScript, npm workspaces, the repo's baseline/pack gates, prettier/biome/
eslint. No network skills; no lockfile writes in the sandbox.

## Workflow

> Delete the dead surface first, then propagate one identity in a single
> sweep, so gates never observe a half-renamed tree.

## Steps

1. Delete the CLI and its feeder: remove `bin/cockpit-agents.mjs`,
   `test/cockpit-agents.test.ts`, and `packages/cockpit-telemetry/`; drop the
   root `bin` field and `bin/*.mjs` from `files`; drop `test:telemetry` and
   its `test:components` link; drop the import/registration in `src/index.ts`;
   drop required files and mentions in `scripts/check-package.mjs`,
   `test/check-package.test.ts`, `test/local-load-probe.test.ts`, docs.
2. Rename the identity everywhere: root `package.json` name to
   `@aemonge-dev/pi-stardeck`, version `0.5.0`, `pi.image` pointer; channels
   `pi-vimux-starship:*` → `pi-stardeck:*` in `src/pi-status.ts`,
   `packages/status/index.ts`, `packages/pi-stardeck/index.ts` and the
   `active-work` channel filter; `vimux-health` → `stardeck-health` in
   `src/health.ts` and tests; remaining string mentions in package
   descriptions, README, AGENTS, `docs/*`, `licenses/README.md`, component
   test fixtures.
3. Rename assets and their gates: `git mv` the tape and GIF to
   `pi-stardeck.*`, rewrite the tape without the npm-global/`pi-agents` beats
   and with the new install identity, update the pinned tape assertions and
   required-file lists in `scripts/check-package.mjs` and
   `test/check-package.test.ts`; re-point
   `openspec/changes/refresh-demo-recording/idea.md`.
4. Refresh `baseline/source.sha256` (`node scripts/check-baseline.mjs
   --write`), then run the sandbox gates: `check:baseline`, focused component
   tests, `test:tooling`, `tsc --noEmit` (+ workspace typecheck),
   `check:package`, `check:composition`, `format:check` after prettier on
   touched files, `lint`, `check:openspec`.
5. Human: refresh the lockfile on host, rerun full `npm run check`, validate,
   publish `0.5.0` under the new name (`--access public`), push, then
   reinstall the extension by the new name and remove the old entry.

## Verification

Deterministic: the Step-4 gate list green on the renamed tree, plus the
repo-wide zero-mention grep from the plan's acceptance. Human: full
`npm run check` exit 0 with the refreshed lockfile; `npm ls` shows the
workspace as `@aemonge-dev/pi-stardeck`.

## Authority and safety

Write scope limited to the repo tree minus the read-only lockfile and minus
`baseline/imported-source.sha256`. No network, no publication, no behavior
change in kept packages. Reversible via one commit revert.
