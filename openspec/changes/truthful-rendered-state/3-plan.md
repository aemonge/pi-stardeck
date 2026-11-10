# Plan

> Spec: truthful-rendered-state · consult `openspec/learnings/` (absent)

## Estimate

30–40 min · high confidence (0.85) — two seams (left title, right work
tile) plus the count contract; breadth is the mirrored title-state edit
and the touched suites.

## Skills

`bare — no catalog skill matches TypeScript Pi-extension work; the
conventions live in-repo (AGENTS.md, defensive-boundary doctrine)`

## Workflow

Direct — both laws are Human-directed (2026-11-10), the preflight facts
sit in 2-investigate.md, and the renderer seam already splits left/right
(`alignedSingleRow`). The parked relay-gate-act-line implementation
(uncommitted, plan-granted) is absorbed into Slice 1: its resolution
plumbing (`gate-act.ts`, `index.ts` routing) is retained, its left-side
render hook is superseded by the dim `{optional}` slot on the right.

## Slices

### Slice 1 — the layout law: left Human-owned, right openspec-only

- [ ] `packages/status/src/active-work.ts`: `formatActiveWorkTitle`
      drops the task branch, the `focus`/`taskTitle`/`gateAct` options,
      and `MAX_TASK_TITLE_POINTS` — pure session name → subject →
      directory chain, byte-independent of openspec
- [ ] `packages/status/src/title-state.ts` +
      `packages/pi-stardeck/src/title-state.ts` (mirrored pair —
      identical edits): the work contract gains optional `gateAct`
      (bounded 180, control-stripped); builders carry it, defensive
      parse accepts it
- [ ] `packages/status/index.ts`: `currentTitleState` stops computing
      `taskTitle` and feeding focus into the subject; the resolved gate
      act re-routes into `buildTitleState`'s work slot
- [ ] `packages/pi-stardeck/src/deck.ts`: `deckWorkSegments` leads with
      the slug segment (`work.change`); `titleBandLines` drops
      `mirrorsFocus`/`mirrorKey` — the left band renders accent
      unconditionally
- [ ] tests: `active-work.test.ts` (subject chain carries no openspec
      text), title-state tests in both packages (`gateAct` round-trip,
      absence drops), deck tests (right tile leads with the slug; left
      never shows openspec)
- [ ] verify: prettier · `npm run lint` · `npm run typecheck` ·
      `npm run test:status` · `npm run test:stardeck`
- [ ] commit `fix(deck): openspec renders exclusively on the right work
      tile` (scoped; body records the absorbed relay hook)

### Slice 2 — file-truth counts

- [ ] `packages/status/src/types.ts`: `OpenSpecState.completedTasks`/
      `totalTasks`/`progressPercent` become optional
- [ ] `packages/status/src/openspec.ts`: count ladder — checkbox tasks →
      done/total artifacts (`status.artifacts[].done`) → absent; the
      instruction-progress and `change.completedTasks/totalTasks`
      fallbacks are removed outright; `complete` = `change.status` or
      counts-complete
- [ ] `packages/status/src/publisher.ts`: `formatOpenSpec` renders no
      progress segment when counts are absent; the header progress
      array's `totalTasks` guard is verified, not changed
- [ ] tests: `openspec.test.ts` (spec-schema, one artifact drafted →
      1 done / 4 total; nothing readable → counts absent),
      `publisher.test.ts` (progress array emits 1/4; absent → no
      counters — never 0/N), parity fixture remains valid
- [ ] verify: full chain again + `node scripts/check-baseline.mjs
      --write` and rerun `npm run check:baseline`
- [ ] commit `fix(status): count work from file truth, never CLI
      opinion` — **final Task commit, held for Human validation**

## Verification

Deterministic: the automated checks above. Live (Human): a spec-schema
change with one artifact drafted renders the right tile as
`<slug> › brainstorm › 1/4 …` with the left showing the session
name/subject untouched; nothing readable renders empty counts, never
0/N; a checkbox schema shows its item counts; a resolved gate act sits
dim in the optional slot.

## History

- 2026-11-10 — drafted after approved brainstorm and investigate; no
  deviations yet. Slice 2's commit is the final Task commit and waits
  for Human validation per repo convention.
