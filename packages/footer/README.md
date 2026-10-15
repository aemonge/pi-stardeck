# footer

Footer telemetry producer for the [pi-stardeck](../../README.md) deck.

The deck renders the telemetry row; this module only feeds it. It walks the
session branch for assistant usage cost and publishes snapshots on
`pi-stardeck:footer-telemetry/v1` after the events that can change them
(session start, message end, model selection, compaction).

It renders nothing, reads no files, sets no timers, and talks to no network.
Quota gauges are a seam (`src/quota.ts`) with no implementations: register a
provider there and the deck row gains its gauge back without renderer
changes.

Composed by the root package; do not install separately.
