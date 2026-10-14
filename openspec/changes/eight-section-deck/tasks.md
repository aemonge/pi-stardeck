# Tasks

Step states: `[ ]` Pending, `[-]` Running/interrupted/failed, `[x]` Complete.

## 1. Title-state publisher

- [x] 1.1 Add `packages/status/src/title-state.ts`: v1 types
      (`subject`, `work{change,task?,done,total}`, `activity{class,target,
      span,parent}`, `waiver{id,notice}`), defensive parser (unknown
      version → null; target ≤ 48 chars; totals ≤ 999), and a builder
      reading the subject entry and OpenSpec focus.
      - Expected: parser rejects malformed input with null, never throws;
        unit tests cover null/active/malformed shapes and bounds (~12
        cases).
      - Receipt: start: 2026-10-14T08:42:00Z · elapsed: ~14m · check:
        `npm --prefix packages/status test` green (166/166; 13 new
        title-state cases), `tsc --noEmit` green · commit `5c4d93a` ·
        paths: `packages/status/src/title-state.ts`,
        `packages/status/test/title-state.test.ts`
- [x] 1.2 Wire the activity feed in the status runtime: classify
      tool-execution starts/updates into
      `editing | reading | grepping | bash | subagent`, attribute
      `span`/`parent` from the runtime span ids, publish the newest event,
      reset to null at turn end.
      - Expected: an edit tool call publishes
        `{"class":"editing","target":"packages/header/src/deck.ts","span":"t87","parent":null}`;
        subagent events carry the parent span id; runtime tests add ~8
        cases (one per class, nesting, idle reset).
      - Receipt: start: 2026-10-14T08:57:00Z · elapsed: ~8m · check:
        `npm --prefix packages/status test` green (177/177; 10 feed cases
        + 1 publisher passthrough case), `tsc --noEmit` green · commit
        `b83aadc` · paths: `packages/status/src/title-activity.ts`,
        `packages/status/src/publisher.ts`, `packages/status/index.ts`,
        `packages/status/test/title-activity.test.ts`,
        `packages/status/test/publisher.test.ts`
- [x] 1.3 Add the per-turn cost meter beside the title state: provider
      usage delta + turn elapsed, reset at `before_agent_start`.
      - Expected: mid-turn `{tokens:4200,elapsedMs:38000}`, idle
        `{tokens:0,elapsedMs:0}`; meter tests cover zero/mid/settled.
      - Receipt: start: 2026-10-14T09:05:00Z · elapsed: ~3m · check:
        `npm --prefix packages/status test` green (185/185; 7 meter
        cases + 1 publisher passthrough case), `tsc --noEmit` green ·
        commit `e860539` · paths: `packages/status/src/turn-cost.ts`,
        `packages/status/src/publisher.ts`, `packages/status/index.ts`,
        `packages/status/test/turn-cost.test.ts`,
        `packages/status/test/publisher.test.ts`
- [x] 1.4 Extend `/galactica-status-debug` with one line printing the live
      title-state JSON.
      - Expected: command output ends with `title-state: {"v":1,...}`.
      - Receipt: start: 2026-10-14T09:07:00Z · elapsed: ~3m · check:
        `npm --prefix packages/status test` green (186/186),
        `npm run test:stardeck` green (111/111, deck untouched),
        `npm run typecheck` green, `check-baseline` PASS with refreshed
        manifest (117 files; `imported-source.sha256` untouched),
        `prettier --check` green on touched files, `check:openspec` PASS
        (4 changes) · paths: `packages/status/index.ts`,
        `packages/status/src/title-state.ts`,
        `packages/status/test/title-state.test.ts`,
        `baseline/source.sha256`, `openspec/changes/eight-section-deck/tasks.md`
- [x] 1.5 Checkpoint: state publishes; the deck renders pixel-identical
      to v0.2.1 (Human confirms via debug line). outcome: VALID · at:
      2026-10-14 · Human confirmed the deck unchanged across two live
      sessions (host `/tmp` idle + devbox repo session); legacy tiles
      (`task 00/00`, `stps 00/00`, `00 › 00`) all present, no Step-1
      leakage; publisher live underneath via `/galactica-status-debug`

## 2. Four-line deck render

- [x] 2.1 Parse the title state in `packages/header` and compose line 2:
      `󰠭 clock ⟩ Subject` left, `Work — change · n/m` or dim
      `— no change owns the moment` right; goal rows stay conditional
      beneath.
      - Expected idle: `󰠭 000:00'00 ⟩ <Subject>    — no change owns the moment`
      - Expected mid-work: `... ⟨ <Subject>    eight-section-deck · 1/4`
      - Receipt: start: 2026-10-14T10:42:00Z · elapsed: ~48m · check:
        `npm run test:stardeck` green (126/126; 8 parser + 8 title-band
        cases, lockstep updates for the counter tiles leaving line 2),
        `npm run test:status` green (186/186), `npm run typecheck` green,
        `check-baseline` PASS with refreshed manifest (119 files;
        `imported-source.sha256` untouched), prettier green · commit
        `86635f5` · paths: `packages/pi-stardeck/src/title-state.ts`,
        `packages/pi-stardeck/src/gauge.ts`,
        `packages/pi-stardeck/src/deck.ts`,
        `packages/pi-stardeck/test/title-state.test.ts`,
        `packages/pi-stardeck/test/deck.test.ts`,
        `packages/pi-stardeck/test/surface.test.ts`,
        `baseline/source.sha256`
- [x] 2.2 Compose line 3: Activity left (`editing <target>`,
      `awaiting Human` idle), this-turn cost right; remove the `task/stps`
      and `00 › 00` counter tiles; spans rows remain conditional below.
      - Expected idle: `awaiting Human` + `— · 0 tok`.
      - Expected mid-work: ` editing packages/header/src/deck.ts` +
        `this turn 4.2k · 0:38`.
      - Expected absence: no `task 00/00`, `stps 00/00`, or `00 › 00` in
        any state.
      - Receipt: start: 2026-10-14T11:32:00Z · elapsed: ~14m · check:
        `npm run test:stardeck` green (132/132; 6 line-3 cases, lifecycle/
        suggestion/runs lockstep rewrites, transitional engine row),
        `npm run test:status` green (186/186), `npm run typecheck` green,
        eslint clean, `check-baseline` PASS with refreshed manifest ·
        commit `a5d9817` · paths: `packages/pi-stardeck/src/deck.ts`,
        `packages/pi-stardeck/test/deck.test.ts`,
        `baseline/source.sha256`
- [x] 2.3 Relocate companion chips from the telemetry head to line 1
      right; move engine/quota/machine/global-cost to line 4 left.
      - Expected (100+ cols): `~/<path> ⟩ main › clean` left, bold
        `[↻ ▤] ⌬  ⛨` right; narrow frames keep chips, path yields first.
      - Receipt: start: 2026-10-14T11:50:00Z · elapsed: ~35m · check:
        `npm run test:stardeck` green (138/138; 6 relocation/line-4 cases,
        chips-right and line-4 lockstep), `npm run test:status` green
        (186/186), `npm run typecheck` green, eslint clean,
        `check-baseline` PASS with refreshed manifest · commit `9356cbe` ·
        paths: `packages/pi-stardeck/src/deck.ts`,
        `packages/pi-stardeck/test/deck.test.ts`,
        `baseline/source.sha256`
- [ ] 2.4 Lockstep deck tests for both accepted mockups; checkpoint:
      Human confirms live sessions match.
      - Test portion complete: both mockups reproduce as fixtures at
        100+ columns (idle: clean git + dim work hint + `— · 0 tok`;
        mid-work: dirty git + `eight-section-deck · 1/4` + `this turn
        4.2k · 0:38`; stale `packages/header` target read as the
        pre-rename `packages/pi-stardeck` spelling). Full gate green:
        `npm run test:stardeck` 141/141, `npm run test:status` 186/186,
        `npm run test:components` green, `npm run typecheck` green,
        `check-baseline` PASS (imported manifest untouched), prettier
        green, `check:openspec` PASS, `check:composition` PASS.
        Checkpoint stays open for the Human.
      - Open-checkpoint amendment (2026-10-14): at the 2.4 review the
        Human ruled four strong separator rules on screen too many (the
        deck's three plus pi's prompt border) and directed the rule
        beneath line 1 removed — line 1 is now the deck's header strip,
        and the pi-status severity counts that rode that rule ride
        line 1's right end beside the companion chips. Applied with
        lockstep test shifts and the plan.md Task-2 mockup blocks
        updated to the amended shape; 2.4 remains open for the Human's
        live confirmation.
      - Second amendment at the 2.4 review (2026-10-14): the Human
        rejected the rule-less header strip and re-accepted a new
        mockup — strong ─ rules bookend the deck (full rule beneath
        line 1, closing rule after line 4), the internal seams are
        dotted ┈, and line 4 splits across its ends: the engine/context
        group flush left, the machine group (quota flame, machine
        readings, global cost) flush right, the machine group yielding
        first on narrow frames. Applied with lockstep test shifts;
        plan.md Task-2 mockup blocks updated; 2.4 stays open for the
        Human's live confirmation. Open Step-3 question: the notice
        slot was designed for line 4 right, which the machine group now
        occupies — placement to be decided at the Step-3 mockup review
        (candidates: notices between the two groups, or the machine
        group yields when notices are present).
      - Third amendment at the 2.4 review (2026-10-14): the Human's
        live render showed the closing rule stacking directly against
        pi's own prompt/input chrome below the deck, reading as a
        doubled big separator — the deck now ends at the telemetry
        row; the opening ─ rule beneath line 1, the dotted ┈ seams, and
        the line-4 split stand. Applied with lockstep test shifts;
        plan.md Task-2 mockup blocks updated; 2.4 stays open for the
        Human's live confirmation.

## 3. Notices and waiver

- [ ] 3.1 Aggregate notices into line 4 right: companion warning texts,
      open-goal hint, diagnostics counts — ranked, ` · `-joined, empty
      when clean.
      - Expected mixed: `⚠ 1 open goal · /goal-focus · appa unreachable · 2 diagnostics`
- [ ] 3.2 Honor `waiver` suppression of the exact matching notice text;
      absence restores it.
      - Expected: waiver on graphify-stale removes only that text.
- [ ] 3.3 Human validation: idle and mid-work sessions match the accepted
      layout; notices appear and clear with their sources.

## 4. Gate and release 0.3.0

- [ ] 4.1 Full gate green (tsc, component suites, format, lint,
      composition, package pack/load); refresh the current baseline
      manifest (`imported-source.sha256` untouched).
- [ ] 4.2 Hand the release to Human: `just publish 0.3.0`, push, swap the
      personal install with the explicit version pin; `pi list` confirms
      `npm:@aemonge-dev/pi-vimux-starship@0.3.0`.
