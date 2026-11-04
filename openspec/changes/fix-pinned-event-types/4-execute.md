# Execute

State legend: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.
A Slice = one conventional commit + one post-commit Human validation. Tasks are quick checkpoints inside a Slice.

## Slice 1 — narrow the event access; prove both type resolutions

- [x] `packages/status/index.ts`: narrow `event` before the auto-title guard; comment states why (pinned types vs runtime contract)
- [x] verify: root `tsc --noEmit`, workspace `tsc --noEmit`, prettier check, `test:status`, `test:stardeck`
- [x] Commit — fix(status): narrow before_agent_start event access for pinned types
      hash:
- [ ] Human validation — response: · outcome: · surfaced:
- live validation attempted 2026-11-03 · failed: focus row rendered
  `— no subject`; live session carried zero
  `galactica-status.session-subject.v1` entries — routed to Slice 2

  gate-attributed · tool: bash · paths: — · at 2026-11-01T17:31:15Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T17:31:36Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T17:31:56Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T17:33:43Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T17:33:50Z

## Slice 2 — fire the auto-title on the real runtime shape

- [x] `packages/status/index.ts`: drop the phantom `messageType` cast/guard; read `event.prompt` via the pinned `BeforeAgentStartEvent` (typed handler, zero casts); comment records the emission truth
- [x] `packages/status/test/active-work.test.ts`: typed `BeforeAgentStartEvent` fixtures (drift fails tsc), malformed raw emit fail-soft, custom-message fixture corrected
- [x] verify: `npm run typecheck` · `npm run format:check` · `npm run lint` · `npm run test:status` · `npm run test:stardeck` — typecheck root+workspaces green · lint clean · status 177 pass · stardeck 154 pass
- [x] baseline: `node scripts/check-baseline.mjs --write` → `npm run check:baseline` green (stale v0.11.0 manifest folds in; pre-existing)
- [x] Commit — fix(status): fire auto-title on the real before_agent_start shape
      hash: 8bf1610
- [ ] Human validation — response: · outcome: · surfaced:

  gate-attributed · tool: bash · paths: — · at 2026-11-03T15:26:18Z

  gate-attributed · tool: bash · paths: — · at 2026-11-03T15:26:26Z

  gate-attributed · tool: bash · paths: — · at 2026-11-03T15:26:31Z

  gate-attributed · tool: bash · paths: — · at 2026-11-03T15:30:05Z

  gate-attributed · tool: bash · paths: — · at 2026-11-03T15:30:13Z
