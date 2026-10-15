# Idea: Deck machine corner on line 1

> Follow-up to replace-fancy-footer-with-stardeck-footer (see the
> metric-regression research recorded in project memory).

As the package maintainer I want the machine readings (CPU › memory › global
cost, joined by the coding-quota flame when quota data exists) to live in one
always-visible status corner on deck line 1's right end, next to the devbox
marker and companion chips, so that notices can never starve metrics and the
ambient machine state is one glance away.

Human-selected design (preview accepted 2026-10-15):

```
~/projects/pi-vimux-starship ⟩ main › 1    [󰆧] [↻] ⌬  ⛨ ⟩ 󰍛 2.1% › 󰘚 812M › 󰜦 $1.23
```

- Devbox `[󰆧]` moves from the line-1 path prefix to the corner's lead chip.
- Engram companion drops its second glyph and stays bracketed: `[↻]`.
- Major `⟩` splits identity (devbox + companions) from machine group.
- Machine group is icon-led (`󰍛` CPU, `󰘚` memory, `󰜦` cost) joined by minor
  `›`, equal single-space padding; the coding-quota flame keeps its frozen
  order at the head of the machine group and renders nothing until a real
  QuotaProvider exists.
- Line 4's right end becomes notice-only; the machine group vacates it, so
  the notice-yield rule can no longer hide CPU/memory/cost.
