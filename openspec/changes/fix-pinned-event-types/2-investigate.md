# Investigate

> Spec: fix-pinned-event-types · aim at the Brainstorm's Questions

## Findings

**Two type resolutions, one runtime truth.** The status workspace's `@earendil-works/pi-coding-agent` resolves differently per environment: in the maintainer sandbox it is symlinked to the running Pi's store copy (newer definitions — the handler compiled clean), while a fresh `npm install` on the host resolves the registry-pinned `0.84.4`, whose `BeforeAgentStartEvent` declares neither `messageType` nor `prompt`. Host `tsc --noEmit` therefore fails at `packages/status/index.ts:1208` while the sandbox never saw the file's failure — the root tsconfig pulled different type sources per machine. The runtime event provably carries both fields: the Pi extension docs specify `before_agent_start` exposes `messageType: "user"` with `prompt` for Human-prompt runs (extensions.md L216), and the shipped auto-title tests exercise exactly that shape through the harness.

**The precedent pattern already exists in-repo.** The publisher reads header events through defensive parsers (`parseHeaderSnapshot`, `parseDeckTitleState`) — external protocol data is never trusted at the type level. The handler's event is the same class of boundary: a narrow structural cast to `{ messageType?: unknown; prompt?: unknown }` followed by value-level narrowing (`!== 'user'`, `typeof === 'string'`) keeps the runtime contract, compiles identically under any type generation, and introduces no `any` — the unknown-typed values are narrowed before use.

**Blast radius.** One file (`packages/status/index.ts`, the `before_agent_start` handler), zero behavior change (the guard logic is identical), zero test change (the harness already passes a structural event). Verification must run the workspace config AND the root config — the root config is what the Human's failing gate invoked.

## Options

- **Structural cast + value narrowing** — three lines, type-generation-proof, matches the repo's defensive-boundary doctrine.
- **Module augmentation** (`declare module` extending `BeforeAgentStartEvent`) — claims fields for every handler repo-wide, but codifies a guess about a vendor type and breaks loudly if the pinned package later declares a conflicting shape.
- **Drop `messageType` and rely on `typeof prompt === 'string'`** — slimmer, but custom-message runs (`pi.sendMessage`) could carry a prompt-shaped field in future types and mis-title; the messageType guard is load-bearing semantics, not ceremony.
