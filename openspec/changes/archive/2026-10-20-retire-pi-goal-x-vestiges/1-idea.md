# Idea: Retire every pi-goal-x vestige from pi-stardeck

> Human-directed 2026-10-20 after spotting a dangling `⚠ 1 open goal ·
> /goal-focus` notice in the live deck. pi-goal-x was already removed
> from `~/.pi/agent/settings.json` packages, but pi-stardeck still
> carries its leftovers: the goal-block takeover, the pool-snapshot
> reader, the `focus/goal` contract seam, and the unfocused open-goal
> notice whose `/goal-focus` command no longer exists.

As the package maintainer I want the deck and the status core to carry
**no goal code at all** — the extension that produced goal state is
gone, so every line that reads, parses, publishes, renders, or
suppresses goal state is dead weight that can only ever mislead (the
paused `hyprpolkitagent` goal in `~/.pi/.goals-pool-snapshot.json`
kept the deck warning about work no agent is doing).

- Full removal, no opt-in flag: the takeover's only residual value was
  *suppressing* pi-goal-x's own widget, meaningless with the extension
  unloaded; the `openGoals`/`selection.source === 'goal'` wire fields
  are versioned but only consumed in-repo at the same version.
- Old session-branch entries (`goal-state`, `pi-goal-state`,
  `pi-goal-focus`) stay unread in append-only branches; the ledger
  restore path fail-softs unknown event types, so nothing to migrate.
- Everything else in the notice ladder (blocked, approval required,
  companion warnings, diagnostics count, waiver suppression) stays
  intact; the empty notice slot still renders the quiet ladybug
  sentinel from the healthy-ladybug-sentinel change.
