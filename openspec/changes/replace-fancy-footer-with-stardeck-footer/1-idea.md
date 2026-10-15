# Idea: Replace fancy-footer with the stardeck footer provider

> Parent idea: stardeck-footer

As the package maintainer I want the footer telemetry produced by one small
owned module, so the deck row stops depending on six thousand imported lines
of mostly dead surface. See the parent idea for the full story; this slice
builds `packages/footer` and deletes `pi-fancy-footer-full-palette`.
