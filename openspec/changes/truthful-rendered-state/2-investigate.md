# Investigate

> Spec: truthful-rendered-state · findings from the read-only preflight (2026-11-10)

## Facts

- **Line 2 already splits left/right.** `renderHeaderDeck`
  (`packages/pi-stardeck/src/deck.ts`) composes
  `alignedSingleRow(focusLines[0], workTile(state, …))` — left is the
  subject band, right is the Work tile. The seam exists; only the
  contents violate the new law.
- **Left today.** `formatActiveWorkTitle`'s task branch paints
  `<change> › <taskId>` (plus the parked relay's `· gate:` hook —
  uncommitted work from relay-gate-act-line) into the subject slot; the
  fallback chain (session name → subject → directory) sits below it.
  `titleBandLines` additionally success-colors the subject when it
  mirrors `work.change` (`mirrorKey` comparison) — dead under the new
  law, since the left can never mirror openspec again.
- **Right today.** `deckWorkSegments` (`packages/pi-stardeck/src/
  title-state.ts`) renders `execute 4/4 › 󰄱 12/15` — current artifact +
  artifact done/total + the current artifact's file-truth item counts —
  and documents that "the change name lives on the subject side and
  never repeats here". Attention (`⏸ awaiting you`, `⚠ focus <age> old`)
  replaces groups; absent facts drop segments; compact width yields the
  attention/progress side first.
- **Count mechanics (bug 2).** `collectOpenSpec` falls back
  tasks → `instructionProgress?.complete ?? change.completedTasks` —
  CLI opinion that pins 0/N on checkbox-less schemas. Consumers:
  `formatOpenSpec` builds a `${completed}/${total}` string
  (publisher.ts:102); the header progress array guards on `totalTasks`
  truthiness (publisher.ts:920) → `gauge` parses `counters.tasks` as
  optional → the deck tile. So optional counts already flow to absence
  end-to-end; only the state contract (`types.ts` required numbers) and
  the two fallbacks lie.
- **Artifact truth exists.** `status.artifacts[].done` (file presence
  via `openspec status`) is parsed into `OpenSpecState.artifacts`
  alongside per-artifact `items` — the ladder's middle rung needs no
  new collection.
- **Slug needs no schema change.** `DeckTitleWorkState.change` already
  carries the slug (bounded 120); `deckWorkSegments` can lead with it.
  The only work-schema addition is the re-homed gate act (`gateAct?`,
  bounded) — and `title-state.ts` exists as a parity-mirrored pair
  (`packages/status` + `packages/pi-stardeck`); both copies change
  identically or parity fails.

## Mapping (Human format → renderer)

`<slug> <artifact> #/(count_artifacts) {optional} #/task_counts`

- `<slug>` — `work.change`, new leading segment on the right
- `<artifact>` — `work.currentArtifact` (existing)
- `#/(count_artifacts)` — done/total artifacts (existing `4/4` pair;
  `#` is Human's pair notation — the live-caught render was plain
  `0/4`, so no literal glyph)
- `{optional}` — the gate act, re-homed from the left relay hook,
  rendered dim when resolved; the parked relay work is absorbed here
- `#/task_counts` — the current artifact's file-truth item counts
  (existing `12/15`, absent when unreadable)
- Separators: minor `›` between segments, matching the deck-wide law
  (major `⟩` stays reserved for line structure)

## Choices

- `formatActiveWorkTitle` loses the task branch, `taskTitle`, and
  `gateAct` options outright — it becomes the pure session/subject
  naming chain; `index.ts`'s focused-task lookup dies with it.
- Count ladder: checkbox tasks → done/total artifacts → absent
  (`completedTasks`/`totalTasks`/`progressPercent` become optional);
  the instruction-progress and `change.completedTasks` fallbacks are
  removed outright; `complete` falls back to `change.status` only.
- `mirrorsFocus` and its `mirrorKey` helper die; the left band keeps
  its accent color unconditionally.
- No config knobs, no new collection — every fact is already published
  or already parsed.
