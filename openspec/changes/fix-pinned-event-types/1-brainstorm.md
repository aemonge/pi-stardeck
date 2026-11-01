# Brainstorm

> Spec: fix-pinned-event-types · consult `openspec/learnings/` before drafting (absent)

## Pain

The auto-title wiring shipped in simplify-deck-defaults accesses `event.messageType` and `event.prompt` on `before_agent_start` directly. Against the running Pi's type definitions that compiles, but against the registry-pinned `@earendil-works/pi-coding-agent` 0.84.4 — what every fresh `npm install` resolves — `BeforeAgentStartEvent` predates those fields, so `tsc --noEmit` fails on a clean checkout and the release gates stay red. The runtime event provably carries both fields (documented Pi behavior; the auto-title tests pass), so the logic is sound — only the type access is unguarded.

## Questions

- How should the handler read fields the pinned type does not declare yet, without weakening narrowing quality or reaching into `any`?
- Can the fix be proven golden against BOTH type resolutions (runtime-linked and registry-pinned) before it reaches the Human's publish step?

<!-- Direction (optional, free): one mutable paragraph of hunch -->
