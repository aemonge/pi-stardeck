# work-state

Owns the branch-local OpenSpec Task focus for the pi-stardeck cockpit: the
`openspec_focus` tool, the `galactica-status.openspec-focus.v1` session entry
write path, and the taskflow conflict guard.

## Entry contract

The session entry name `galactica-status.openspec-focus.v1` is an
**interface, not an ownership mark**: it predates this package and must stay
byte-identical for existing sessions and external readers. A contract test
(`test/contract.test.ts`) asserts byte-identity against the renderer's copy —
runtime code never imports across packages; the suites enforce the name.

External readers:

- **`pi-openspec-gate`** (separate repository) — parses latest-wins
  `galactica-status.openspec-focus.v1` entries, with explicit clears. Do not
  change the entry shape or name.

## Focus changes

After each successful focus write this package emits the `pi.events` event
`focus-changed` carrying the new focus data. The status renderer subscribes
and repaints; no other consumer is required, and the package fails soft when
nothing listens.

## No slash command

Focus is set only through the `openspec_focus` tool, on explicit Human
direction or an exact declared OpenSpec Task handoff — never inferred. There
is deliberately **no slash command**; clears and replacements happen through
the tool's `clear` / `replace` actions under the same policy.
