# RESUME — stardeck-footer swap, mid-flight

> Written 2026-10-15 when the Human paused the session. Read this, then the
> tasks file below, and continue. Delete this file when the slice ships.

## Where we are

Change: `openspec/changes/replace-fancy-footer-with-stardeck-footer`
(ramona-plan; parent idea `stardeck-footer`). Steps 1–3 complete, Step 4
interrupted mid-flight, Step 5 is host-side. Everything is wip-committed
(message `wip: stardeck footer swap mid-flight`).

What landed in Steps 1–3:

- `packages/footer/` — clean-room telemetry provider (~200 lines + tests):
  walks `ctx.sessionManager.getBranch()` for assistant usage cost, publishes
  `{ protocol: 1, type: "snapshot", totalCost }` (optional `quotaPercent`
  via an empty `QuotaProvider` seam) on `pi-stardeck:footer-telemetry/v1`
  after `session_start` / `message_end` / `model_select` /
  `session_compact`. Zero timers/network/files/config. 14/14 tests,
  typecheck green, parity test runs the deck's own `parseFooterTelemetry`.
- Composition swap: `src/index.ts` composes `footerTelemetry` (no options);
  `COCKPIT_COMPOSITION` says `footer:telemetry`; root `test:footer` →
  `packages/footer`; `/fancy-footer` command removed from health + load
  probe (7 commands now).
- Deleted: `packages/pi-fancy-footer-full-palette/` (6,297 lines) and
  `licenses/pi-fancy-footer-LICENSE`. Updated: README, AGENTS entrypoint
  list + provenance line, licenses/README, check-package required files,
  deck README stale claims, docs/architecture + status-architecture +
  source-inventory.
- Two preflight discoveries recorded in the plan amendment: the
  `pi-fancy-footer:widget` channel is a LIVE wire (deck emits, Vim
  prompt-rail consumes, status embeds a 1,300-line publisher for it) — it
  is NOT part of the deleted module and was deliberately left alone.

## Resume here (Step 4)

```bash
node scripts/check-baseline.mjs --write
npm run check          # full battery; expect all PASS
graphify update .
```

Then flip Step 4 to `[x]` in
`openspec/changes/replace-fancy-footer-with-stardeck-footer/4-tasks.md`
(with checks), commit as a scoped step commit, and hand Step 5 to the Human:
host `npm run check`, `just publish 0.6.0`, push, `pi install` the new
version, spot-check the deck row (model · thinking · context · cost, no
gauge, no footer error conditions).

## Gotchas learned this session

- Tool calls must be strictly sequential in this environment (`appa`
  rejects a second concurrent call; parallel tool batches error out).
- The mutation guard wants focus set: use the cockpit `subject`/`work_focus`
  tools and `openspec_focus` before repo work.
- devbox blocks: `git push`, `git tag`, `git rm` (use plain `rm` + `git add`),
  `npm publish` (no token), and writes to `~/.pi` (read-only mount).
- `npm install --package-lock-only` DOES work in the sandbox (used for the
  0.5.0 release; refresh it again if workspace names changed).

## Still open after this slice

1. **Push**: several commits (from `step(rename-product-to-pi-stardeck):
record 5 VALID…` through this wip) are local-only. The Human's prompt
   showed `⇣1` — fetch and inspect (`git log --oneline --graph main
origin/main -8`) before pushing.
2. Follow-up slice (named in the plan amendment):
   `retire-fancy-footer-widget-protocol` — rename/retire
   `pi-fancy-footer:widget` + `:ready` across status/deck/Vim, including
   the dead `:ready` subscription in `packages/pi-stardeck/index.ts:358`.
3. Offered, unconfirmed: bounded registry-wait in `just publish` (first
   release of a name races npm propagation, cost us one failed 0.5.0
   install).
4. User machine: `~/.pi/agent/fancy-footer.json` is now orphaned by the new
   provider — the zai error disappears with the 0.6.0 install even without
   deleting it (the file is simply never read again).
5. `openspec/changes/rename-product-to-pi-stardeck` and
   `rename-header-to-pi-stardeck` are complete but still in `changes/`;
   consider archiving both.

## Recent history (this arc)

- `f1d0a49` product renamed to `@aemonge-dev/pi-stardeck`, CLI +
  cockpit-telemetry removed
- `d53352c` release 0.5.0 (lockfile) → published, tag `v0.5.0`, installed
- `2346d50` rename ledger closed
- wip: this slice, Steps 1–3
