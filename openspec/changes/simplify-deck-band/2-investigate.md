# Investigate

> Spec: simplify-deck-band · aim at the Brainstorm's Questions (Q1–Q7)

Method note: the pi.dev fetch and one core-dist read were refused by the
openspec-gate hook; both proved unnecessary — the package is installed locally,
so its running source is authoritative, and in-repo evidence covers the rest.

## Findings

**F1 — the package is already here and enabled.** `pi-run-timestamps` v0.1.0
(roldan, MIT, one 139-line `index.ts`, peer-deps only) is installed at
`~/.pi/agent/npm/node_modules/pi-run-timestamps/` and wired in
`~/.pi/agent/settings.json` as `npm:pi-run-timestamps`.

**F2 — what it renders (answers Q1's coverage, Q2's content).**
- *Live per-activity elapsed in the workspace loader*: patches
  `Loader.prototype.start/stop/updateDisplay` with a WeakMap of start times;
  the spinner line becomes `Thinking (12s)` / `Running command (1m 05s)`.
  Format is human-scaled (`12s`, `1m 05s`, `1h 2m 3s`).
- *`Sent 14:32:05`* notify on each user `message_end`.
- *`Done at 14:33:18 · 1m 13s`* notify on `agent_settled` — the turn's
  wall-clock span (first `agent_start` → settle; includes tool calls, retries,
  compaction recovery).
- Display-only: nothing enters the session or LLM context (README + source).

**F3 — no collision (answers Q2).** The package never touches transcript
message components: core keeps rendering completed `▸ Ran … (1.8s)` lines with
its own durations; the package only augments the live loader line and adds two
notification stamps. The deck's clock families (`turnCostTile`, `spanTreeRows`
in `packages/pi-stardeck/src/deck.ts`) are separate surfaces entirely.

**F4 — the one real risk (answers Q3).** The loader patch reaches into
private internals (`frames`, `currentFrame`, `spinnerColorFn`, `message`,
`setText`, `ui.requestRender`). It is defensive (method-existence checks,
`Symbol.for` version latch) and degrades gracefully: if the internals move, the
`Sent`/`Done` stamps keep working and only the live elapsed is lost. Brittle
against future `pi-tui` updates; no configuration surface exists (README).

**F5 — deck clock inventory.** Two live clock families in the deck: the turn
chronometer `mmm:ss'cc · tokens` (`turnCostTile`, fed by the status package's
`turnCost` track, ticked by the 50 ms `activityAgeTimer` in
`packages/pi-stardeck/index.ts`), and per-span rows `└ (mm'ss) <agent> <stage>`
(`spanTreeRows`, fed by `activeRunSpans`). Completed-run durations in the
transcript are core-owned and untouched by any deletion considered here.

**F6 — span publication is an isolated track (answers Q7's shape).**
`packages/status/index.ts` runs three independent tracks off tool events:
`turnCost` (line 616), `runtimeSpans`/`RuntimeSpanStore` → `activeRunSpans` +
`idleMs` + heartbeat republish (lines 179, 230–236, 566–570), and
`titleActivity` (line 687). The line-3 activity label (`bash <command>`)
belongs to `titleActivity`, **not** to spans — retiring spans does not touch
the command line. In-repo grep shows the deck's `spanTreeRows` is the only
consumer of `activeRunSpans`.

**F7 — tick retirement rides along.** The 50 ms `activityAgeTimer` exists for
the chronometer; with all deck clocks gone it can retire (it is already
duty-cycled to zero wakeups when idle).

**F8 — the never-read telemetry (grounds Q4/Q5).** The clusters the Human
skips all live in the deck band: model › thinking › long-horizon quota
(`modelGroupLeft`, `simpleQuotaTile`), coding-window quota › reset countdown ›
CPU › memory › load › cost (`windowQuotaTiles`, resource tiles; data from the
footer package's telemetry publisher and `process-resources.ts`). Producers
stay healthy independently of presentation. Severity chips
(`statusAlertTile`) already implement an appear-only-when-notable pattern
in-band.

## Options

**O1 — clock-removal depth.**
(a) *Renderer-only*: deck stops drawing both clock families; the status
package keeps tracking/publishing spans, `idleMs`, and turn cost. Smallest
diff, fully reversible, but dead computation and a misleading heartbeat
remain.
(b) *Full retirement*: deck tiles + parsers, status span track and heartbeat,
turn-cost track, and the 50 ms tick all go. Honest cleanup, larger diff across
two packages plus their tests; subagent span data stops existing anywhere.
Pick (b) unless the Human wants a reversible first step or foresees re-use of
span data (O3's cost then argues for (a)).

**O2 — telemetry simplification shape (answers Q4's form question).**
(i) *Static minimal group*: one always-there compact cluster (e.g. model +
context); permanent width cost, zero surprise.
(ii) *Notable-only*: every demoted tile appears at thresholds (quota ≥ X%,
cost ≥ $Y, resource spikes), mirroring `statusAlertTile`; zero idle width,
tiles pop in unbidden.
(iii) *Hybrid*: one static ambient tile + notable-only for the rest; two
mechanisms to maintain.
Exact tile list and thresholds are Plan material with the Human's must-stay
list (Q5).

**O3 — parallel-run visibility cost of killing span rows.** With span rows
gone, N-parallel child agents are observable only through the current loader
line and the status narrative row; per-child elapsed-at-a-glance disappears.
Single-stream sessions lose nothing (the loader elapsed covers the live run).
The Human's direction already accepts this; recorded as the trade-off.

## Alternatives

- **Status quo (keep deck clocks).** What it is: both deck clock families
  stay alongside the package's stamps. Trade-off: the duplication pain
  persists and the band stays dense. Pick-when: the Loader patch breaks in a
  future core update *and* the `Sent`/`Done` stamps prove insufficient as the
  workspace's time story.
- No other genuine alternative presented itself; a deck-re-rendered minimal
  clock was the pre-change direction and was explicitly redirected by the
  Human, so it is not listed as an option.

## Question ledger

- **Resolved:** Q1 (all deck clocks retire; the workspace carries live
  per-activity elapsed, sent stamps, and turn totals — F2), Q2 (no collision —
  F3), Q3 (package installed/enabled; degradation path known — F4).
- **Carried to Plan:** Q4/Q5 (which tiles survive, in O2's which shape, with
  the Human's must-stay list), Q6 (which amendment comments/contracts are
  amended or deleted with the tiles), Q7 (O1 depth).

## Human redirection (post-showcase) — O2 superseded

The Human rejected threshold shaping entirely: the telemetry cluster survives
**verbatim**, and visibility itself becomes the control. New shape (O2iv, on
the record for Plan):

- A **toggleable extra-info section**: ON shows the resources cluster
  (`󰈸 1% › 󰅐 4:48 ⟩ 󰍛 0.1% › 󰘚 432M ⟩ 󰾆 8% ⟩ 󰜦 $0.15`) left and the model
  cluster (`󰚩 GLM-5.3-Flash › high ⟩ 󰃰 7d 31%`) right, one row; OFF removes
  the row wholesale.
- The focused-change chip (`󰈙 simplify-deck-band`) relocates to the prompt-row
  right end, always visible in both states.
- OFF is the daily view: prompt row + subject/work line, nothing else.
- Clocks and sub-process rows stay dead in both states — the time story rides
  the workspace plugins (pi-run-timestamps), per the Human: "time and
  sub-process relying on other plugins".
- Context tokens do not appear in either mock state; the dotted rule above the
  telemetry row disappears in the mocks (solid rules only).
