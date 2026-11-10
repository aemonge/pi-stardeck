# Investigate

> Spec: relay-gate-act-line · findings from the read-only preflight (2026-11-09)

## Facts

- **Render path.** The focus row's text is `formatActiveWorkTitle`
  (`packages/status/src/active-work.ts`): the task branch builds
  `change › taskId taskTitle`, the output flows through
  `buildTitleState` → `title.subject` and renders on the deck's title
  band line 2 (`bandWrap` already wraps overflow; subject bound is 180
  points). The legacy `selection.titles` path is pre-title fallback only.
- **Async seam.** `refreshOnce` (`packages/status/index.ts`) is the only
  place that shells out; it is commit-guarded (generation + focus-same
  check) before state is applied, then `publish()` renders synchronously
  from the store. `CommandRunner` is injected (`pi.exec`), and the
  `openspec` CLI already spawns through it with a 5s timeout.
- **Cache doctrine precedent.** `artifactItemsCache` in `openspec.ts` is
  mtime-keyed; `changeDirectoryMtime` provides the contained-path guard
  pattern to reuse for `openspec/changes/<change>/.openspec.yaml`.
- **Failure surface, observed live.** `pios-gate act relay-gate-act-line`
  refuses with a non-zero exit while the change is unapproved — the
  cockpit therefore renders declared focus alone until Human opens the
  change. This is the designed fail-soft path proving itself: unknown
  change (exit 2), unapproved change, missing binary, timeout, and empty
  output all collapse to "no gate line".
- **Test blast radius.** Existing harness tests run with
  `cwd = /work/galactica`, where no `openspec/` directory exists, so
  `hasOpenSpecProject` is false and the gate probe never spawns in
  current suites. New behavior is covered by a dedicated module test
  plus `active-work.test.ts` formatter cases.

## Choices

- Placement in the formatter (not the deck renderer): one producer, the
  band already owns wrapping; `gateAct` absent → byte-identical output.
- 2000ms probe timeout (tighter than the CLI's 5000ms — fail quiet and
  cheap); negatives cached exactly like hits, one probe per meta mtime.
- 30s TTL only when the meta file cannot be statted (absent now and at
  cache time); a defined-but-changed mtime always re-probes, and a
  vanished meta re-probes honestly.
- No config knob: the relay rides `openspec.enabled` and the OpenSpec
  project detection already in place.
