# Execution: Rename header to pi-stardeck

> Estimate: 45–90 min (from plan) · Human wait: host lockfile refresh, final
> gates, push · Parent idea: customize-pi-stardeck

## Skills

TypeScript, npm workspaces, the repo's baseline/pack gates. No network skills;
no lockfile writes in the sandbox (read-only — delegated to the Human).

## Workflow

> Mechanical rename with a pre-grepped reference map; every propagation lands
> in one Step so gates never see a half-renamed tree.

## Steps

1. Move `packages/header` → `packages/pi-stardeck` (filesystem move; the
   commit records the rename). Update its `package.json` name to `pi-stardeck`
   and its README title/mentions.
2. Propagate references: root `package.json` (`test:header` → `test:stardeck`,
   `npm run test` chain), `scripts/check-package.mjs` required files,
   `src/index.ts` import path, `packages/cockpit-telemetry/index.ts` comment,
   `bin/cockpit-agents.mjs` comment, docs (`handoff.md`, `development.md`,
   `source-inventory.md`, `AGENTS.md`).
3. Refresh `baseline/source.sha256` via `node scripts/check-baseline.mjs
   --write`; rerun `check:baseline`.
4. Run gates: `npm run test:stardeck`, `tsc --noEmit`, `check:package`,
   `check:openspec`, prettier on touched files.
5. Human: refresh the lockfile on host (`npm install --package-lock-only` or
   the repo's offline refresh), rerun full `npm run check`, push.

## Verification

Deterministic: the Step-4 gate list green plus `check:baseline` PASS on the
refreshed manifest. Human: full `npm run check` exit 0 on host with the
refreshed lockfile; `npm ls` shows the workspace as `pi-stardeck`.

## Authority and safety

Write scope limited to the repo tree minus the read-only lockfile. No network,
no publication, no behavior change. The rename is reversible via one commit
revert.
