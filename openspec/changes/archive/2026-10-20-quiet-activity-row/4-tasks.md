# Tasks: The quiet activity row retires when idle

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## Step 1 — render

- [x] 1.1 `activityBandSpeaks` predicate (activity OR cost speaks)
- [x] 1.2 Conditional activityRow + conditional pre-band seam; spans
      keep their seam; span rows computed once

## Step 2 — tests

- [x] 2.1 Flip idle-presence assertions (counts, mockup regex, tile
      scans) to absence
- [x] 2.2 New: hide-both-idle, show-cost-speaks, show-activity-speaks,
      no-double-seam-spanless, spans-keep-seam

## Step 2.5 — band honesty amendment (Human feedback)

- [x] 2.5.1 `TitleActivityFeed.finish` + owner tracking; wired at
      `tool_execution_end` (packages/status)
- [x] 2.5.2 `observedActivityLabel` live phase-word fallback in deck.ts
- [x] 2.5.3 Tests: restored title-activity suite (clobber incident,
      recovered from HEAD + 2 finish tests) + finish coverage (166/166);
      deck phase-word test; spec thinking-gap scenario
- [x] 2.5.4 Reviewer PASS 6/6; its rest-state regression fixed —
      awaiting-* kinds never speak for the band (focused sessions still
      retire); 152/152 deck, root gate PASS

## Step 3 — spec + gate

- [x] 3.1 Amend deck-title-state layout listing (conditional line 3)
- [x] 3.2 `npm run check` green (package + root)
- [x] 3.3 Reviewer pass (PASS 6/6; nits fixed: spec notice-slot
      wording tightened, plan count slip 7→5; spec edit made directly by
      Ramona under the focused change)
- [x] 3.4 Human visual validation received ("VALID <3" after the
      live mixed-turn demo); archived; ships with the 0.9.2 release

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/deck.ts · at 2026-10-20T08:59:31Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/deck.ts · at 2026-10-20T08:59:43Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T08:59:43Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T08:59:52Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T09:01:05Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T09:01:52Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T09:02:41Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T09:02:50Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T09:03:02Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T09:03:10Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T09:03:22Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-10-20T09:05:47Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-10-20T09:06:07Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-10-20T09:06:27Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T09:06:49Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T09:06:59Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-10-20T09:07:22Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T09:07:35Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T09:08:05Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T09:09:44Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T09:10:17Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T09:13:30Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-20T09:13:30Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T09:19:20Z

  gate-attributed · tool: mem_save · paths: — · at 2026-10-20T09:19:44Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T10:55:35Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T10:57:08Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/title-activity.ts · at 2026-10-20T11:00:58Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/src/title-activity.ts · at 2026-10-20T11:01:27Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/status/index.ts · at 2026-10-20T11:01:28Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/deck.ts · at 2026-10-20T11:01:44Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/deck.ts · at 2026-10-20T11:02:15Z

  gate-attributed · tool: write · paths: /home/aemonge/projects/pi-stardeck/packages/status/test/title-activity.test.ts · at 2026-10-20T11:02:39Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-10-20T11:02:40Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T11:02:52Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T11:05:43Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T11:05:56Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T11:07:25Z

  gate-attributed · tool: subagent · paths: — · at 2026-10-20T11:10:17Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/deck.ts · at 2026-10-20T11:18:05Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/src/deck.ts · at 2026-10-20T11:18:33Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-10-20T11:18:34Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T11:18:47Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T11:22:10Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-10-20T11:22:23Z

  gate-attributed · tool: edit · paths: /home/aemonge/projects/pi-stardeck/packages/pi-stardeck/test/deck.test.ts · at 2026-10-20T11:22:48Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T11:23:16Z

  gate-attributed · tool: mem_save · paths: — · at 2026-10-20T11:25:48Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T11:26:01Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T11:42:02Z

  gate-attributed · tool: bash · paths: — · at 2026-10-20T11:42:26Z
