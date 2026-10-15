# Idea: The stardeck footer

> Parent idea: customize-pi-stardeck

As the package maintainer I want the footer telemetry computed by one small
owned module on Pi's own extension API, so the product stops shipping six
thousand imported lines — most of them dead paths — to feed one deck row.

Observed pain: `pi-fancy-footer-full-palette` is 6,297 imported source lines,
but in this cockpit it runs in telemetry-only mode: no `setFooter`, no UI, no
Git polling, no widgets. Its live contribution is walking the session branch
for `totalCost` and polling provider quotas (1,466 lines of Codex/Claude OAuth
and z.ai envelope handling) whose every source is dead on this machine — and
which produce the recurring `zai quota status is unavailable` error. The deck
(`packages/pi-stardeck`) is already the sole renderer of the telemetry row:
model, thinking level, and context come from its own context reads; cost and
quota arrive on `pi-stardeck:footer-telemetry/v1`. Re-adding a `ctx.ui` footer
component would create a second renderer, which the Pi TUI docs explicitly
forbid.

Direction and hard limits: a clean-room `packages/footer` telemetry provider
built on `@earendil-works/pi-coding-agent` events and `sessionManager` — it
publishes the existing `pi-stardeck:footer-telemetry/v1` snapshot protocol
byte-compatibly so the deck keeps rendering unchanged. It renders nothing,
configures nothing (`fancy-footer.json` and the `/fancy-footer` editor die),
polls nothing, and ships an empty `QuotaProvider` seam so a coding-plan gauge
can be added later without touching the deck. The Pi packages remain
peerDependencies provided by the host. `pi-fancy-footer-full-palette` is
deleted with its config surface, commands, and license provenance after the
deck row renders identically from the new provider.

## Musts

- `packages/footer` publishes `{ protocol, type: "snapshot", totalCost }`
  snapshots on `pi-stardeck:footer-telemetry/v1` after the same events the
  old module used (session start, message end, model change, compaction),
  computed from `ctx.sessionManager.getBranch()` usage.
- `QuotaProvider` seam (interface + empty default registry) may add
  `quotaPercent`/`quotaWindows` later; today the fields stay absent and the
  deck renders no gauge.
- Deterministic tests for the usage walk (assistant messages only, cache
  fields, malformed usage), the event → publish mapping, and protocol
  validation parity with the deck's `parseFooterTelemetry`.
- Zero timers, zero network, zero file reads, zero config in the module.
- One scoped swap: `src/index.ts` composition, root scripts
  (`test:footer`, `test:components`), `check-package` required files,
  command lists (health + load probe), README/AGENTS/licenses mentions, then
  delete `packages/pi-fancy-footer-full-palette/` and
  `licenses/pi-fancy-footer-LICENSE`; baseline refresh; gates green.

## Boundaries

- No deck changes except none at all: the deck's parser, gauges, and rows are
  untouched.
- No `setFooter`, no new UI, no new config file, no provider polling.
- Peer-dependency model unchanged.
- No behavior work beyond the telemetry snapshot contract.

## Value

The product sheds its largest imported module and its last third-party
surface; the footer becomes a few hundred owned lines with no failure modes
(the zai error dies by construction), the deck stays the single renderer, and
future quota support arrives through one narrow seam.
