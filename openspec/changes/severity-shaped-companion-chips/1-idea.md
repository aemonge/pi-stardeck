# Idea: Severity-shaped companion chips — brackets, parens, bare + stronger color

> Human-directed 2026-10-19 after reviewing the live 0.8.0 corner
> ("I think we can make all this icon have [ and ] … [] error or off,
> () warnings, bare healthy — since the colors are barely visible.
> For all four, and bolder or stronger colors").

As the package maintainer I want the four corner chips (devbox 󰆧, engram ↻,
graphify ⌬, appa ⛨) to encode severity in **shape**, with a stronger color
pass underneath, so the corner reads even when the terminal dims color —
today `companionIconColor` admits "color is the only state signal" and the
accent/muted pair is nearly indistinguishable on dim panels.

Human-selected design (accepted 2026-10-19, conversation):

```
all error/off:   [󰆧] [↻] [⌬] [⛨]     shape carries severity alone
all degraded:    (󰆧) (↻) (⌬) (⛨)
all healthy:      󰆧  ↻  ⌬  ⛨          bare — problems pop, healthy recedes
mixed (the norm): [↻] (⌬) ⛨
```

- **Shape = coarse severity** (grayscale-proof): `[]` error-or-off,
  `()` degraded (warn/stale/update recommended), bare healthy.
- **Color = fine grain, layered under shape**: healthy accent, degraded
  warning, error error, off muted — brackets no longer collapse off vs
  error because color still separates them where visible.
- `COMPANION_WARNING_PATTERN` splits: warn-grade words → parens,
  error-grade words (error/fail/down/unreachable/unhealthy/needs
  attention) → brackets.
- **Devbox chip joins the law**: today `[\u{F01A7}]` is always bracketed,
  which under the new semantics misreads as broken; it goes bare when
  healthy like the companions.
- **Engram identity bracket retired** — the glyph is the identity.
- **Stronger pass**: chips render bold (already true) and degraded/error
  chips escalate to `loud()` (reverse-video) so the enclosure has a
  matching weight even at one glance; parens/brackets keep the chip's
  semantic color.
- Spacing: bare→bare keeps the 0.7.1 double-gap rule; cluster width
  becomes state-dependent (±4 chars, all-error widest) — accepted jiggle,
  corner budget unchanged.

Mnemonic: the more enclosed, the worse.
