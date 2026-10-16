# Idea: Deck corner gains context and summary counts

> Follow-up to deck-machine-corner. Human-directed 2026-10-16 after
> reviewing the live 0.7.1 corner ("I'm missing on the top right the
> current context, summary counts and daily consumption… bottom left
> should feel global: GLM name and temp and weekly consumption").

As the package maintainer I want the current context percent and the
compaction (summary) count to ride the line-1 machine corner, and line 4's
left end to feel global — model › thinking › weekly consumption — so the
whole consumption story (context burn, summaries, near-term quota, cost)
reads in one glance at the top right while the bottom row keeps only
long-horizon, session-wide facts.

Human-selected design (accepted 2026-10-16, conversation):

```
[󰆧] [↻] ⌬  ⛨  ⟩ 󰈸 flame? › 󰍛 cpu › 󰘚 mem › 󰾆 ctx › 󰎞 sums › 󰜦 $
󰚩 GLM-5.3 › high › 󰃰 weekly
```

- `󰾆 ctx` — current context percent (warning ≥ 85%), moving up from
  line 4's engine group.
- `󰎞 sums` — compaction count, i.e. the "summary counts".
- Near-term quota ("daily") is the coding flame `󰈸` already frozen at the
  corner head — z.ai exposes a 5h coding window plus a weekly cap, not a
  calendar-day window, so the flame is the daily-consumption slot.
- Line 4 left = `󰚩 model › thinking › 󰃰 weekly-calendar` (the `7d` window
  keeps its engine-left home); context and compaction vacate.
- Yield ladder extends with the group: drops right-to-left (cost first),
  identity cluster never drops.

Delivered together with `zai-quota-provider`, which lights the flame and
the weekly calendar; this slice is renderer-only and testable with
synthetic windows regardless.
