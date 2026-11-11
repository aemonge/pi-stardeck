# Execute

> Spec: observe-room-aim · state legend: [ ] open · [x] done · ~ skipped

## Slice 1 — the printer (aim reader + aimed tile)

- [x] room-aim.ts reader + aimed tile branch + fixtures + gate-act retirement
      started_at: 2026-11-11T09:22Z · ended_at: 2026-11-11T09:35Z · total: ~13m · check: status 160 ✓ · stardeck 163 ✓ · work-state 13 ✓ · footer 28 ✓ · vim 37 ✓ · format ✓ · lint ✓ · tsc ✓ · baseline PASS ✓ · paths: packages/status/{src/room-aim.ts,src/title-state.ts,index.ts,src/gate-act.ts✝,test/room-aim.test.ts,test/title-state.test.ts,test/gate-act.test.ts✝}, packages/pi-stardeck/{src/title-state.ts,test/title-state.test.ts}, baseline/source.sha256
- [ ] feat(deck): render the room aim verbatim
      hash: a35538e

<!-- gate receipts land here while work runs; per-Slice H2s mirror the Plan's H3s -->

## Slice 2 — store retirement

- [x] work-state package, session-fact contract, restore paths, reducer event,
      focusAt/focusStale/awaitingValidation stamping, legacy pins, taskflow guard
      retired whole; focus contract fields reduced to the aim's five (aimTask →
      task); gate-act probe predecessor removed in Slice 1
      started_at: 2026-11-11T09:40Z · ended_at: 2026-11-11T10:20Z · total: ~40m ·
      check: status 140 ✓ · stardeck 149 ✓ · footer 28 ✓ · vim 37 ✓ · tooling 24 ✓ ·
      format ✓ · lint ✓ · tsc ✓ · baseline PASS (96 files) ✓ · check:openspec known
      pre-existing red ✓ · paths: packages/work-state/**✝, packages/status/{index.ts,
      src/active-work.ts,src/config.ts,src/ledger.ts,src/publisher.ts,src/reducer.ts,
      src/title-state.ts,src/types.ts}, packages/status/test/{active-work,ledger,parity,
      publisher,reducer,title-state}.test.ts, packages/pi-stardeck/{src/title-state.ts,
      src/deck.ts,test/title-state.test.ts,test/deck.test.ts},
      packages/pi-stardeck/{src/activity-age.ts✝,test/activity-age.test.ts✝}, src/index.ts,
      package.json, docs/status-architecture.md, packages/status/README.md,
      baseline/source.sha256
- [x] refactor(status): retire the session-fact focus store
      hash: a475335 + acc287d (fix-forward: compact law corrected to yield only
      the dim next-step; stardeck fixtures realigned)

## Slice 3 — plain wording sweep

- [x] 16 leftover wording hits replaced with plain language; the retired-v1
      graveyard fixture retired with the store in Slice 2
      started_at: 2026-11-11T10:24Z · ended_at: 2026-11-11T10:27Z · total: ~3m ·
      check: stardeck 149 ✓ · status 140 ✓ · format ✓ · paths:
      packages/pi-stardeck/src/deck.ts (machineCornerLadder → machineCornerNotices),
      packages/status/src/openspec.ts, packages/pi-stardeck/test/deck.test.ts,
      packages/status/test/openspec.test.ts
- [ ] chore: plain wording sweep
      hash: 2701606

## Slice 4 — README pi-title note

- [x] one recommended-pairing line in the root README
      started_at: 2026-11-11T10:28Z · ended_at: 2026-11-11T10:29Z · total: ~1m ·
      check: format ✓ · paths: README.md
- [ ] docs: recommend pi-title in the README
      hash: 45d063b

## Slice 5 — frame re-order (Human mockup, 2026-11-11)

- [x] work tile drops `next-step`; engine row right carries it verbatim
      (dim); the session-id sentinel retires whole (`sessionShortId`,
      `SENTINEL_BUG`, `SENTINEL_ID_MIN_WIDTH`, `shortSessionId`, wire
      spread); warnings own a dynamic line beneath the engine row with a
      seam that exists only when a warning speaks
      started_at: 2026-11-11T10:52Z · ended_at: 2026-11-11T11:45Z · total: ~53m
      (incl. the hang hunt) · check: stardeck 148 ✓ · status 140 ✓ · footer 28 ✓
      · vim 37 ✓ · tooling 24 ✓ · format ✓ · lint ✓ · tsc ✓ · baseline PASS
      (96 files) ✓ · paths: packages/pi-stardeck/{src/deck.ts,src/title-state.ts,
      index.ts,test/deck.test.ts,test/title-state.test.ts,test/surface.test.ts},
      openspec/changes/observe-room-aim/{3-plan.md,4-execute.md},
      baseline/source.sha256
      learned: the surface.test hang was a skipped `session_shutdown` —
      cleanup now rides a `finally`, never assertions
- [x] feat(deck): the aim's action row and the warning line
      hash: b2d65d6

## Slice 6 — the focus spec takes the engine row (Human live-frame pass)

- [x] the duplicate dies: `next-step` out of the tile builder — line 2
      prints `artifact_name artifact-idx › task ⟩ next-step`; the engine
      row right carries the slug verbatim (success), gray
      `(unfocus openspec)` when the room has no aim; `task: ""` unwraps
      symmetric YAML quote pairs before the emptiness check
      started_at: 2026-11-11T15:05Z · ended_at: 2026-11-11T15:20Z · total: ~15m ·
      check: stardeck 148 ✓ · status 140 ✓ · format ✓ · lint ✓ · tsc ✓ ·
      baseline PASS ✓ · paths: packages/status/src/room-aim.ts,
      packages/pi-stardeck/{src/deck.ts,src/title-state.ts,
      test/deck.test.ts,test/title-state.test.ts}, baseline/source.sha256
- [x] feat(deck): the focus spec takes the engine row
      hash: f129202

- [ ] Human validation — response: · outcome: · surfaced:

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/room-aim.ts · at 2026-11-11T09:25:22Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/title-state.ts · at 2026-11-11T09:25:56Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/title-state.ts · at 2026-11-11T09:26:31Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/title-state.ts · at 2026-11-11T09:27:02Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-11T09:27:37Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-11T09:27:54Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:28:00Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:28:09Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:28:52Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:29:10Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/title-state.test.ts · at 2026-11-11T09:29:27Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:29:36Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/title-state.test.ts · at 2026-11-11T09:29:51Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/room-aim.test.ts · at 2026-11-11T09:30:20Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/title-state.test.ts · at 2026-11-11T09:30:51Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:30:54Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/title-state.test.ts · at 2026-11-11T09:31:34Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:31:37Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/room-aim.test.ts · at 2026-11-11T09:32:19Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:32:23Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:32:31Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:32:37Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:32:43Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:33:02Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:33:56Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:34:12Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:34:22Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:35:32Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/title-state.ts · at 2026-11-11T09:37:35Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/title-state.ts · at 2026-11-11T09:38:10Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/title-state.ts · at 2026-11-11T09:39:08Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/title-state.ts · at 2026-11-11T09:39:13Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/title-state.ts · at 2026-11-11T09:40:17Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:40:26Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:40:38Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/deck.ts · at 2026-11-11T09:40:44Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/title-state.test.ts · at 2026-11-11T09:41:37Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:41:42Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:41:53Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-11-11T09:43:01Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:43:07Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:43:12Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:43:21Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:43:33Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:43:55Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:44:00Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:44:05Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:44:10Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:44:42Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:44:47Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:45:42Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:45:50Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:46:08Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/title-state.ts · at 2026-11-11T09:46:21Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/title-state.ts · at 2026-11-11T09:46:34Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:46:38Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/title-state.test.ts · at 2026-11-11T09:47:57Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:48:38Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:48:45Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/title-state.test.ts · at 2026-11-11T09:49:29Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:49:36Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/publisher.test.ts · at 2026-11-11T09:50:04Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/publisher.test.ts · at 2026-11-11T09:50:09Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:50:13Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:50:31Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-11T09:50:55Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-11T09:51:39Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-11T09:52:00Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-11T09:52:15Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-11T09:52:32Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:52:39Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-11T09:52:53Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/title-state.test.ts · at 2026-11-11T09:53:05Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:53:13Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:53:25Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:54:06Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/active-work.ts · at 2026-11-11T09:55:22Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/reducer.ts · at 2026-11-11T09:57:01Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/ledger.ts · at 2026-11-11T09:57:11Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/types.ts · at 2026-11-11T09:57:19Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/publisher.ts · at 2026-11-11T09:58:22Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/publisher.ts · at 2026-11-11T09:58:47Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/publisher.ts · at 2026-11-11T09:58:53Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/publisher.ts · at 2026-11-11T09:59:08Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:59:12Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-11-11T09:59:30Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/reducer.ts · at 2026-11-11T09:59:35Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/reducer.ts · at 2026-11-11T09:59:44Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T09:59:51Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:00:42Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/ledger.test.ts · at 2026-11-11T10:00:56Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/reducer.test.ts · at 2026-11-11T10:01:14Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/parity.test.ts · at 2026-11-11T10:01:35Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:01:39Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:01:48Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:01:53Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:02:00Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/ledger.test.ts · at 2026-11-11T10:02:12Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:02:56Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:03:00Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:03:08Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:03:14Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/publisher.test.ts · at 2026-11-11T10:03:27Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:03:30Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:03:35Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:03:41Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:03:45Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/publisher.test.ts · at 2026-11-11T10:04:01Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:04:10Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:04:18Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:04:22Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:07:11Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:07:34Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:07:43Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:08:09Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:08:28Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:08:36Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:09:29Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:10:12Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:10:25Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:11:50Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/active-work.test.ts · at 2026-11-11T10:12:51Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:13:04Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:13:12Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/src/index.ts · at 2026-11-11T10:13:22Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:13:28Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:14:02Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/test/local-load-probe.test.ts · at 2026-11-11T10:14:51Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:15:03Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:15:49Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:16:21Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:16:35Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:16:44Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:17:25Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:17:56Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:18:13Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:18:55Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:19:38Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:20:06Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:20:31Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:20:38Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:22:03Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:22:30Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:22:41Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:23:20Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:23:45Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:23:53Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:24:03Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-11-11T10:24:43Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:24:48Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:25:20Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:25:27Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:25:33Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:26:07Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:26:14Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:26:22Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:26:39Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:26:47Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:27:07Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:27:25Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/title-state.ts · at 2026-11-11T10:27:57Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:28:30Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:28:41Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:28:55Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:29:01Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:31:14Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/package.json · at 2026-11-11T10:31:29Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:31:34Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:33:29Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:34:35Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:34:42Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/README.md · at 2026-11-11T10:35:59Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:36:05Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:36:33Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:37:58Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:38:03Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:38:12Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:38:17Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:39:17Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T10:40:28Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T12:27:15Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T12:29:49Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/deck.ts · at 2026-11-11T12:30:51Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/deck.ts · at 2026-11-11T12:31:11Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T12:31:27Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T12:31:39Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-11-11T12:32:31Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-11-11T12:32:54Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T12:33:12Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T12:33:21Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T13:34:00Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T13:34:46Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T13:34:53Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T13:37:12Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T13:37:52Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:25:27Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:25:39Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:26:19Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:26:55Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:27:55Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:28:01Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:28:07Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:28:13Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:28:28Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:28:35Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:28:45Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:29:04Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:29:10Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:29:31Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:29:42Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:29:49Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:30:00Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:30:09Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:30:16Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:30:26Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:30:31Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:30:39Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:30:46Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:30:55Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:31:02Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:31:28Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:31:35Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:31:43Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:32:05Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:32:13Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:32:21Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:32:42Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:32:50Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:33:21Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:33:30Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:33:48Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:34:00Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:34:11Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:34:17Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:34:46Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:34:52Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:34:58Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:35:03Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:35:24Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:35:41Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:36:03Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:36:10Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:36:20Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:36:30Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:36:35Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:36:43Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:37:27Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:38:32Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:38:39Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:38:44Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:40:00Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T14:40:10Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:00:08Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:00:27Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:00:35Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:00:46Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:00:54Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:01:05Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:01:13Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:01:21Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:03:46Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:03:59Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:04:05Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:04:23Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:04:31Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:04:41Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:04:50Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:05:17Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:05:24Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:06:34Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:06:42Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:07:32Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:07:39Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:08:03Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:08:36Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:08:43Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:08:59Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:09:07Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:09:41Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:09:47Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:09:54Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:10:33Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:11:40Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:11:45Z

  gate-attributed · tool: bash · paths: — · at 2026-11-11T15:12:37Z
