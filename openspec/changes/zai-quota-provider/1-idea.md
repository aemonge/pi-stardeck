# Idea: z.ai quota provider

> Parent idea: stardeck-footer (its QuotaProvider seam shipped empty by
> design). Human-directed 2026-10-16: "z.ai for now, Codex and Claude on
> extension."

As the package maintainer I want one real QuotaProvider — the z.ai/GLM
coding plan — registered on the empty seam, so the deck's frozen slots
light up: the coding flame `󰈸` (5h window, with reset countdown) in the
line-1 corner and the weekly `󰃰 7d` calendar on line 4, with no renderer
change and no new surfaces.

The registry stays the extension point: Codex and Claude arrive later as
sibling providers, never as edits to this one.

## Clean-room facts (recovered from git history `bc474cb^`, the deleted
`provider-status.ts`; re-derived, not copied)

- Endpoint: `GET https://api.z.ai/api/monitor/usage/quota/limit` with
  `Authorization: Bearer <key>`.
- Key source: `~/.pi/agent/auth.json` → `{ zai: { key } }`, where the key
  may be a literal or a `${ENV}` reference (pi auth convention).
- Envelope: `{ data?: { limits: [...] } }`; each limit carries `type`,
  usage as `percentage` or `usage`+`currentValue` (percent =
  currentValue/usage × 100), and `nextResetTime` (unix seconds).
- `TIME*` limits are the monthly MCP allowance — skipped; the token/credit
  pair gates coding sessions.
- z.ai reports no window ordering or durations: sort by reset deadline —
  nearest is the coding window (label `5h`), next the weekly cap (`7d`);
  labels fall back by reset distance (≤2d → 5h, ≤15d → 7d, else `<n>d`).

## Fail-soft contract

No key, unreachable API, or malformed envelope → the provider snapshots
`undefined` and the deck stays dark — never a repeat of the old
`zai quota status is unavailable` error spam. One debug-level line per
distinct failure mode at most.
