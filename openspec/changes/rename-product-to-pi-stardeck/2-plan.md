# Plan: Rename product to pi-stardeck, retire the CLI

> Estimate: 60–120 min · confidence: high
> Evidence: `rename-header-to-pi-stardeck` landed cleanly at `94f28c7`;
> full reference map grepped this session; no external extension consumes the
> `pi-vimux-starship:*` channels (checked `~/.pi/agent/extensions` and the
> installed galactica packages)
> Human wait: host lockfile refresh, full gates, publish, push

## Acceptance

- Root `package.json` is `@aemonge-dev/pi-stardeck` at `0.5.0`; the `bin`
  field, `bin/*.mjs` files entry, and `bin/cockpit-agents.mjs` are gone.
- `packages/cockpit-telemetry/` is deleted (it existed only to feed the CLI
  board); `src/index.ts` no longer imports or registers it; root
  `test:components` chain drops `test:telemetry`.
- Event channels read `pi-stardeck:*` in `src/pi-status.ts`,
  `packages/status/index.ts`, `packages/pi-stardeck/index.ts`, and the
  `active-work` test that filters on the channel string.
- `vimux-health` command and banner are `stardeck-health`
  (`src/health.ts`, README, docs, tests).
- Assets renamed: `docs/assets/pi-stardeck.gif`, `demo/pi-stardeck.tape`
  (tape re-choreographed without the npm-global/`pi-agents` beats; GIF bytes
  unchanged — re-render stays with the `refresh-demo-recording` idea, which
  this slice re-points).
- `scripts/check-package.mjs` and `test/check-package.test.ts` required-file
  and tape-assertion lists match the new tree; `test/cockpit-agents.test.ts`
  deleted.
- Repo-wide grep (excluding `openspec.old`, `openspec/changes` history,
  `baseline/`, `node_modules`, lockfile) finds zero `pi-vimux-starship`,
  `vimux`, `cockpit-agents`, and `pi-agents` mentions.
- `baseline/source.sha256` refreshed; `check:baseline`, focused tests,
  `tsc --noEmit`, `check:package`, `format:check`, `lint`, `check:composition`,
  `check:openspec` green in the sandbox.
- Human: lockfile refresh on host, full `npm run check` exit 0, publish
  `0.5.0` as `@aemonge-dev/pi-stardeck`, push.

## Scope

Root and workspace package identities, version bump to `0.5.0`, the
`pi.image` pointer, `files` list, CLI deletion, `cockpit-telemetry` package
deletion, event-channel strings, health command id and strings, state-dir and
env-var names (`PI_STARDECK_STATE_DIR` — moot once the sink is deleted, so
only if a reference survives), asset and tape renames plus their gate
assertions, README/docs/AGENTS/licenses mentions,
`openspec/changes/refresh-demo-recording/idea.md` re-pointing (paths and the
dropped `pi-agents` value claim), baseline manifest refresh.

## Exclusions

Zero behavior or render change in the kept packages. No re-render of the demo
GIF (host-side VHS, still owned by `refresh-demo-recording`). No npm
publication, no lockfile writes, no push from the sandbox. No new features, no
layout work, no `pi-stardeck` standalone publication of the deck package.
Leaving `~/.local/state/pi-vimux-starship/` and the old npm-installed
`@aemonge-dev/pi-vimux-starship` package in place on the host (user removes on
reinstall; noted in the report).
