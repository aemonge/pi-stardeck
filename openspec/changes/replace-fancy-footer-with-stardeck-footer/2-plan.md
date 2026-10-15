# Plan: Replace fancy-footer with the stardeck footer provider

> Estimate: 60–120 min · confidence: high
> Evidence: preflight this session — `src/index.ts` runs the module in
> telemetry-only mode; the deck is the sole renderer of the telemetry row via
> `pi-stardeck:footer-telemetry/v1` (`packages/pi-stardeck/index.ts:375`,
> `parseFooterTelemetry` in `gauge.ts`); old-module usage walk located in
> `render.ts:getUsageData`/`collectSessionUsageMetrics`
> Parent idea: stardeck-footer
> Human wait: publish 0.6.0, push, reinstall

## Acceptance

- `packages/footer/` exists: `index.ts` (extension factory + event wiring),
  `src/telemetry.ts` (usage walk + snapshot publishing), `src/quota.ts`
  (`QuotaProvider` seam + empty registry), `package.json` (workspace, tests),
  `README.md`, tests mirroring the deck module's discipline.
- The provider publishes `{ protocol: 1, type: "snapshot", totalCost }` on
  `pi-stardeck:footer-telemetry/v1` — validated byte-compatibly by the deck's
  own `parseFooterTelemetry` (shared test fixture).
- No timers, network, file reads, or config anywhere in the module;
  `grep -rn "setTimeout\|fetch\|readFile" packages/footer` (excluding tests)
  finds nothing.
- `src/index.ts` composes `footerTelemetry` from `packages/footer`;
  `COCKPIT_COMPOSITION` says `footer:telemetry`; `fancy-footer` command
  removed from health `PACKAGE_COMMANDS` and the load-probe expectations
  (8 → 7 commands).
- `packages/pi-fancy-footer-full-palette/` and
  `licenses/pi-fancy-footer-LICENSE` deleted; `licenses/README.md`,
  `scripts/check-package.mjs` required files, root `test:footer`/
  `test:components`, README module list, AGENTS baseline/provenance mentions
  updated; repo-wide grep finds zero references to the deleted package
  (`pi-fancy-footer-full-palette`, the `/fancy-footer` command, its license
  and config) outside openspec history and the lockfile.

> **Amended during execution (preflight discoveries).** The live
> `pi-fancy-footer:widget` protocol is NOT a reference to the deleted
> module: the deck emits it and `pi-vim-top-border`'s prompt rail consumes
> it, and `packages/status` embeds a 1,300-line widget publisher for the same
> wire. Renaming or retiring that protocol touches the deck, status, and Vim
> packages this slice explicitly excludes, so it is recorded as the follow-up
> slice `retire-fancy-footer-widget-protocol` instead of being smuggled in
> here. The grep above therefore excludes the widget-protocol constants and
> channel strings inside `packages/status`, `packages/pi-stardeck`, and
> `packages/pi-vim-top-border`.
- `baseline/source.sha256` refreshed; `check:baseline`, component tests,
  `tsc --noEmit`, `check:package`, `check:package:load`, `format:check`,
  `lint`, `check:composition`, `check:openspec` green.
- Human: full `npm run check` on host, `just publish 0.6.0`, push, reinstall.

## Scope

The new module and its tests; the composition swap in `src/index.ts`; command
list updates in `src/health.ts` and `test/local-load-probe.test.ts`; deletion
of the old package and its license file; doc/manifest/gate propagation;
baseline refresh. The deck, status, and Vim packages are untouched.

## Exclusions

No deck/renderer changes of any kind. No `setFooter`, no UI, no config file,
no provider polling, no quota implementations. No version bump in-tree
(`just publish 0.6.0` owns the bump, tag, and release commit). The orphaned
`~/.pi/agent/fancy-footer.json` on user machines is ignored, not migrated.
