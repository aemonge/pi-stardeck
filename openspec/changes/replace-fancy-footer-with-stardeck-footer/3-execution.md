# Execution: Replace fancy-footer with the stardeck footer provider

> Estimate: 60–120 min (from plan) · Human wait: host gates, publish 0.6.0,
> push, reinstall · Parent idea: stardeck-footer

## Skills

TypeScript, the repo's event-protocol and gate conventions. No network, no
timers, no UI skills needed — the module only reads session state and emits.

## Workflow

> Build the new provider and prove protocol parity against the deck's own
> parser first; swap the composition; then delete the old module and
> propagate mentions in one sweep so gates never see a half-swapped tree.

## Steps

1. Author `packages/footer` (factory, usage walk, snapshot publishing, quota
   seam, package.json/README) with tests: usage walk cases, event mapping,
   and a parity fixture asserted through the deck's `parseFooterTelemetry`.
2. Swap the composition: `src/index.ts` import + registration,
   `COCKPIT_COMPOSITION` entry, root `test:footer`/`test:components`
   scripts, command lists in `src/health.ts` and
   `test/local-load-probe.test.ts`; run `test:tooling`, `test:footer`, deck
   tests.
3. Delete `packages/pi-fancy-footer-full-palette/` and
   `licenses/pi-fancy-footer-LICENSE`; update `licenses/README.md`,
   `scripts/check-package.mjs` required files, README module list and
   diagram wording, AGENTS entrypoint/provenance lines; zero-mention grep.
4. Refresh `baseline/source.sha256`; run the gate battery (`check:baseline`,
   component tests, typecheck, `check:package`, `check:package:load`,
   `format:check`, `lint`, `check:composition`, `check:openspec`); graphify
   update.
5. Human: full `npm run check`, `just publish 0.6.0`, push, reinstall the
   npm package, spot-check the deck row (model · thinking · context · cost,
   no gauge, no error conditions).

## Verification

Deterministic: Steps 2–4 gates green plus the zero-mention grep. Human: the
rendered deck row is identical to 0.5.0 minus the dead quota gauge, and
`Pi status` shows no footer-sourced conditions.

## Authority and safety

Write scope limited to the repo tree minus the lockfile and
`baseline/imported-source.sha256`. No network, no publication, no UI. The
swap is reversible via one commit revert.
