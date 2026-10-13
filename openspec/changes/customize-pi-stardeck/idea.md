# Idea: The customizable stardeck

The cockpit header is purely a header surface with rich extension support today:
a deck of tiles (PWD gauge, title, activity clock, capabilities, git, process
resources) rendered above the editor. The package name `header` no longer names
what it is. This slice renames it `pi-stardeck` and gives the deck a public
customization surface, so users shape their own command deck instead of
accepting one frozen arrangement.

The name `pi-stardeck` was probed free on the npm registry on 2026-10-06 (both
`pi-stardeck` and `@aemonge-dev/pi-stardeck` are unclaimed). The package stays
a bundled workspace package inside `@aemonge-dev/pi-vimux-starship` for now;
the free registry name is reserved for the standalone future the
`share-pi-vimux-starship` idea describes.

## Musts

- Rename `packages/header` to `packages/pi-stardeck`, propagating the workspace
  manifest, test script names, `scripts/check-package.mjs` required files,
  documentation mentions, and a refreshed baseline manifest. Rename precedent:
  `galactica-context-header` → `header` and `galactica-status` → `status` both
  landed cleanly with this machinery.
- A public configuration surface: users choose which deck tiles render and
  configure tile behavior through a bounded, documented configuration file.
  Configuration must fail soft — an invalid user config never breaks the deck.
- Theming: the palette becomes user-configurable while the frozen render
  contract (layout, row grammar, spacing) stays byte-stable for default
  settings. Default output must not change.

## Explicitly paused (not silently dropped)

- Layout and element relocation stay deferred, per the frozen status
  architecture contract (`develop-frozen-status-architecture/plan.md` Scope:
  "layout or element relocation (explicitly deferred by the contract)") and by
  Human direction on 2026-10-06. Tile toggling and theming are customization;
  moving elements is a later slice with its own validation.

## Boundaries

- No Pi core changes; the deck remains an extension surface.
- No new telemetry sources; customization shapes what already exists.
- The frozen zero-row surface, privacy boundary, and fail-soft-without-Git
  rule from `share-pi-vimux-starship` carry over unchanged.

## Value

A user installs the cockpit and gets their deck: their tiles, their
palette, their header. The package name finally describes the artifact, and
the npm namespace is secured for the day the stardeck ships alone.
