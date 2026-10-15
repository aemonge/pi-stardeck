# Idea: Rename product to pi-stardeck, retire the CLI

> Parent idea: customize-pi-stardeck

As the package maintainer I want one product name — `pi-stardeck` — across the
repository, npm identity, docs, channels, and assets, and no unused CLI, so the
project stops carrying two identities and dead surface.

Observed pain: the repo, GitHub origin, and directory are already `pi-stardeck`,
while the npm product, README, event channels, state dirs, health command, and
demo assets still say `pi-vimux-starship`; the `pi-agents` CLI and its
`cockpit-telemetry` snapshot feeder have never been used and only exist to
support each other. Direction and limits: finish the rename the
`rename-header-to-pi-stardeck` slice started, extend it to the composed package
identity, and delete the CLI plus its orphaned feeder in the same slice. No
behavior, layout, or feature work beyond the rename and removal.
