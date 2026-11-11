# Plan

> Spec: observe-room-aim · consult `openspec/learnings/estimation.md`
> and `skills.md` (both absent)

## Estimate

~90 focused minutes · high — mostly deletion; the reader and the
render are small pure units with fixture-driven tests.

## Skills

bare — repo conventions carry it; no listed skill matches
TypeScript/TUI work.

## Workflow

direct, because every choice was fixed by the Brainstorm's rulings —
observe the file, render verbatim, retire the rest; nothing left to
pick between.

## Slices

### Slice 1 — the printer (aim reader + aimed tile)

- [ ] `packages/status/src/room-aim.ts` — bounded walk-up (≤40 dirs)
      from cwd to the nearest `openspec/` root; read `.focus`; parse
      the five flat fields (`change`, `artifact-name`, `artifact-idx`,
      `task`, `next-step`) leniently: garbage lines ignored, last key
      wins, empty/comment-only values = missing; mtime-keyed cache
      (stat per refresh, read on change, absent-file negative TTL)
- [ ] aimed tile branch in `status/index.ts` + `deriveTitleWork`
      (both mirrored title-state copies) renders the file fields per
      the render law `{change} ⟩ {artifact_name} {artifact-idx} ›
      {task} ⟩ {next-step}`; deck segment layout uses `⟩` major / `›`
      minor
- [ ] fixtures: one test per render-matrix row (Brainstorm, 11 rows)
      plus malformed rows (garbage line, duplicate key last-wins,
      empty value)
- [ ] `packages/status/src/gate-act.ts` deleted with its call sites —
      `next-step` replaces the `gate:` slot verbatim

### Slice 2 — store retirement

- [ ] `packages/work-state/` retires whole: `openspec_focus` tool,
      `galactica-status.openspec-focus.v1` appends, taskflow-run
      guard; composition drops it (`src/index.ts`), root
      `package.json` script + manifest references removed
- [ ] `packages/status`: `restoreOpenSpecFocus`/`parseOpenSpecFocus`/
      `sameOpenSpecFocus`, `focus/openspec` reducer event,
      `focus-changed` listener, `focusAt`/`focusStale`/
      `awaitingValidation` stamping removed (mirrored title-state
      pair edited identically)
- [ ] legacy pins deleted: passive branch (`status/index.ts`) +
      `config.openspec.change` / `PI_OPENSPEC_CHANGE` keys
      (`packages/status/src/config.ts`)
- [ ] graveyard fixture (`title-state.test.ts` v1 `ladder`/`rung`
      keys) retires with the contract it proves — Human vetoed by
      silence per Brainstorm handoff

### Slice 3 — plain wording sweep

- [ ] 16 hits replaced with plain wording ("order", "counts",
      "wins over"); `machineCornerLadder` → `machineCornerNotices`
- [ ] paths: `packages/pi-stardeck/src/deck.ts`,
      `packages/status/src/openspec.ts`,
      `packages/pi-stardeck/test/deck.test.ts`,
      `packages/pi-stardeck/test/title-state.test.ts`,
      `packages/status/test/openspec.test.ts`

### Slice 4 — README pi-title note

- [ ] one recommended-pairing line in the root `README.md` — honest,
      no marketing

## Verification

Deterministic: `npm run check:baseline` before first mutation; per
slice the nearest focused suite, then formatter (write + check), lint,
`npm run typecheck`; after all slices the full `npm run check`
(`check:openspec` known pre-existing red), then baseline re-pin
`node scripts/check-baseline.mjs --write` + rerun. All offline,
credential-free.

The one human-only act: resume a session in the aimed room and see
the right tile print `observe-room-aim ⟩ … ⟩ eospec …` verbatim from
`openspec/.focus` — plus a verdict per slice commit.

## History

- pending — one conventional commit per slice, oldest first:
  `feat(deck): render the room aim verbatim` ·
  `refactor(status): retire the session-fact focus store` ·
  `chore: plain wording sweep` ·
  `docs: recommend pi-title in the README`
