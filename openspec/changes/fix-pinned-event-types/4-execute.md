# Execute

State legend: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.
A Slice = one conventional commit + one post-commit Human validation. Tasks are quick checkpoints inside a Slice.

## Slice 1 — narrow the event access; prove both type resolutions

- [ ] `packages/status/index.ts`: narrow `event` before the auto-title guard; comment states why (pinned types vs runtime contract)
- [ ] verify: root `tsc --noEmit`, workspace `tsc --noEmit`, prettier check, `test:status`, `test:stardeck`
- [ ] Commit — fix(status): narrow before_agent_start event access for pinned types
      hash:
- [ ] Human validation — response: · outcome: · surfaced:

  gate-attributed · tool: bash · paths: — · at 2026-11-01T17:31:15Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T17:31:36Z

  gate-attributed · tool: bash · paths: — · at 2026-11-01T17:31:56Z
