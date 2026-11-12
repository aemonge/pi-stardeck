# Plan

> Spec: simplify-deck-band · `openspec/learnings/` does not exist (nothing consulted)

## Estimate

0.5–1.5 focused sessions · ~250–450 line delta, mostly deletions · confidence
medium-high: pure renderer/publisher surgery on packages we own, with the
status-package track removal carrying the only real test-surface risk. Pinned
at commit time.

## Skills

bare — no `openspec/learnings/skills.md` exists and no repo skill matches
deck-band renderer work.

## Workflow

Committed route: **O1b full retirement + O2iv toggleable extra-info** (the
Human's redirected design). Investigate's sole genuine alternative — status
quo with deck clocks — lost: the duplication pain persists, the Human
redirected twice, and the workspace plugins (pi-run-timestamps) now own the
time story. Renderer-only removal (O1a) lost as a stopping point: dead
publishers are worse than dead pixels.

### The committed band (the contract this plan implements)

OFF (default, and the daily view):

```
[prompt row ······················································  󰈙 simplify-deck-band]
────────────────────────────────────────────────────────────────────────────────────────
<subject / work line — unchanged narrative>
────────────────────────────────────────────────────────────────────────────────────────
```

ON (`/stardeck-extra`):

```
[prompt row ······················································  󰈙 simplify-deck-band]
────────────────────────────────────────────────────────────────────────────────────────
<subject / work line>
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
󰈸 1% › 󰅐 4:48 ⟩ 󰍛 0.1% › 󰘚 432M ⟩ 󰾆 8% ⟩ 󰜦 $0.15      󰚩 GLM-5.3-Flash › high ⟩ 󰒋 38% ⟩ 󰃰 7d 31%
────────────────────────────────────────────────────────────────────────────────────────
```

- Extra-info row: resources cluster left (verbatim), model › thinking ⟩
  **context** ⟩ long-horizon quota right. Context tokens park here.
- Dotted rule survives only as the toggle area's top border (ON only).
- Focused-change chip relocates to the prompt-row right end, both states;
  model cluster vacates the prompt row into the ON row.
- Retired everywhere, both states: turn chronometer + turn tokens, span tree
  rows, running-command (activity) line — the workspace loader
  (pi-run-timestamps) owns live timing; `Sent`/`Done` stamps own turn totals.
- Toggle: settings key `stardeckExtraInfo` (boolean, default `false`) sets the
  durable default; `/stardeck-extra` toggles for the running session (does not
  write settings). API wiring follows `/usr/lib/pi/docs` (settings.md,
  extensions.md) as authority at execute time.

## Slices

### Slice 1 — deck: clocks out, toggle in

- [ ] `npm run check:baseline` passes on the untouched tree (repo gate before
      any source mutation).
      started_at: · ended_at: · total: · check: · paths:
- [ ] `packages/pi-stardeck/src/deck.ts`: remove `turnCostTile`,
      `spanTreeRows`, `formatDeckElapsed`, span/turn parsing consumers and the
      activity-band rows; render the OFF/ON band per the contract (dotted
      top border ON-only; focus chip rides the prompt-row slot; model cluster
      + context tile join the resources cluster in the ON row).
      started_at: · ended_at: · total: · check: · paths:
- [ ] `packages/pi-stardeck/index.ts`: retire the 50 ms `activityAgeTimer`;
      read `stardeckExtraInfo` (default false); register `/stardeck-extra`
      session toggle per the extension docs.
      started_at: · ended_at: · total: · check: · paths:
- [ ] Tests: update `deck.test.ts` / `surface` fixtures — clock assertions
      die, new OFF-default + ON-row + chip-relocation coverage in.
      started_at: · ended_at: · total: · check: · paths:
- [ ] Focused checks green: formatter, lint, typecheck, package tests.
      started_at: · ended_at: · total: · check: · paths:
- [ ] Commit `feat(deck): toggleable extra-info band, clocks retired` (scoped
      diff only), then human validation of the OFF default and the toggle.
      started_at: · ended_at: · total: · check: · paths:

### Slice 2 — status: retire the orphaned tracks

- [ ] Confirm no remaining consumers, then delete in
      `packages/status/`: `RuntimeSpanStore` / `activeRunSpans` / `idleMs`
      heartbeat, `turnCost` track, `titleActivity` track, and their publisher
      fields; `runtime-runs.ts` goes with them.
      started_at: · ended_at: · total: · check: · paths:
- [ ] Status package tests updated to the thinner publisher.
      started_at: · ended_at: · total: · check: · paths:
- [ ] Full gates: `npm run lint && npm run typecheck && npm test`,
      `npm run check:openspec`, offline `npm run check:package:load`.
      started_at: · ended_at: · total: · check: · paths:
- [ ] Re-pin the manifest: `node scripts/check-baseline.mjs --write`, rerun
      `npm run check:baseline` (imported-source manifest untouched).
      started_at: · ended_at: · total: · check: · paths:
- [ ] Commit `refactor(status): retire orphaned span and turn tracks`, then
      human validation of the live session.
      started_at: · ended_at: · total: · check: · paths:

## Verification

Deterministic: per-slice focused checks; Slice 2 ends with the full gate set
above plus the re-pinned baseline. Static checks do not prove live TUI
behavior. The one human-only act: launch a real pi session and confirm —
default OFF shows only prompt row (with the chip), subject/work, rules;
`/stardeck-extra` reveals the ON row with dotted top border, resources left,
model › thinking ⟩ context ⟩ quota right; no clock exists anywhere in either
state; the workspace loader ticks `(elapsed)` and `Done at · dur` stamps land.

## History

- (draft — commit subjects land in the slice tasks)
