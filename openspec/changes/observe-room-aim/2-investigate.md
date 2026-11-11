# Investigate

> Spec: observe-room-aim · aim at the Brainstorm's Questions

## Findings

**F1 — The gate's file contract today.** `openspec/.focus` is a bare
slug: `writeFocus`/`readFocus`/`focusPath` in
`~/projects/pi-openspec-gate/bin/gate-lib.js` (terminal-only writes),
and the pending act is already computed per verb via `pendingAct(...)` —
the "next: read 4-execute.md → pios-gate go" line. The same lib
hand-parses flat `key: value` YAML for `.openspec.yaml` (no YAML
library anywhere), so the rich five-field `.focus` needs no new
dependency gate-side. The cockpit never reads the file today —
`grep -rn "\.focus" packages/` hits only `gate-act.ts`'s
*subprocess* probe, which spawns `pios-gate <slug>` and caches by
meta-file mtime (`packages/status/src/gate-act.ts`).

**F2 — The session-fact store's full consumer map** (what retires when
`.focus` becomes the one store):
- `packages/work-state/index.ts` — registers `openspec_focus`
  (set/replace/validate/clear), appends
  `galactica-status.openspec-focus.v1` entries, guards conflicting
  taskflow runs (`taskflowRunFocus` + block).
- `packages/status/src/active-work.ts` — mirrored focus contract
  (types, `parseOpenSpecFocus`, `restoreOpenSpecFocus`,
  `sameOpenSpecFocus`) restored in `status/index.ts` `session_start`
  / `session_tree`.
- `packages/status/src/reducer.ts` — `focus/openspec` ledger event.
- The installed gate extension reads the same entry type for bash
  attribution (`~/projects/pi-openspec-gate/src/focus.ts`) — Human is
  replacing this with `.focus`-only reading in the eospec update; the
  cockpit does nothing here.
- One behavioral loss, noted not decided: the taskflow-run conflict
  guard dies with the tool. No replacement exists in the agreed
  schema; Plan decides whether one is wanted.

**F3 — Deck work-tile data flow today.** `publish()`
(`packages/status/index.ts:612`) hard-gates `focusedOpenSpec` to
`focus.mode === 'task'`; `buildTitleState` → `deriveTitleWork`
(`packages/status/src/title-state.ts`, mirrored in
`packages/pi-stardeck/src/title-state.ts`) renders
`<change> › <artifact> <counts>` from focus + collector snapshot. The
aimed path replaces the focus half with the file's five fields; the
render law (`{change} ⟩ {artifact_name} {artifact-idx} › {task} ⟩
{next-step}`) replaces the segment builder. Compact-width degradation
(<56 compact, <40 silent) stays layered on top unchanged.

**F4 — Counting consumers.** The collector
(`packages/status/src/openspec.ts`) feeds more than the tile:
`collectOpenSpecOverview` (footer status surface), watcher watch-lists
(`tasksPath`, changes dir), diagnostics project-root resolution, and
gate-act's contained-root check. The aimed tile stops *consuming*
collector counts (fields arrive in-file), but the collector and its
watchers stay for those other consumers. Legacy pins
(`config.openspec.change`, `PI_OPENSPEC_CHANGE`) have exactly one
consumer: the passive branch at `status/index.ts:406-418` — retiring
them is a pure deletion there plus their config keys
(`packages/status/src/config.ts`).

**F5 — `gate-act.ts` retirement is clean.** Consumers: the `gateAct`
slot in `currentTitleState` + widget building only. No dedicated test
file exists for it (status tests: active-work, ledger, openspec,
publisher, parity, reducer, title-state). The module, its subprocess
probe, and its mtime cache die; the cache *pattern* (stat per refresh,
read on change) moves to the new `.focus` reader.

**F6 — Vocabulary sweep inventory.** 17 hits, all comments / test
names / fixtures: `deck.ts` ×5 (machine ladder, ranked, outrank,
`machineCornerLadder`), `openspec.ts` ×2 (mid-ladder, file-truth
ladder), `title-state.test.ts` ×2, `deck.test.ts` ×6, `openspec.test.ts`
×2. 16 replace with plain wording ("order", "counts", "wins over").
One exception: `title-state.test.ts:138`'s fixture carries the retired
v1 keys `ladder`/`rung` *on purpose* — it proves retired contracts are
ignored. Rewording it would delete the compatibility proof; flagged for
Human's call in Plan.

**F7 — Reader mechanics.** The `.focus` reader needs: walk-up from cwd
to the nearest `openspec/` root (bounded, same as the gate's
`findOpenspecRoot`), parse the five flat fields, expose mtime for the
cache. Fixture-edit testing maps one test per render-matrix row from
the Brainstorm, plus malformed-line rows (garbage ignored, last key
wins, empty values treated as missing).
