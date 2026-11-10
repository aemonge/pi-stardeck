# Plan

> Spec: relay-gate-act-line · consult `openspec/learnings/` (absent — bare)

## Estimate

20–30 min · high confidence (0.9) — one new bounded module, one formatter
option, one extension seam; breadth is the new module tests and the two
touched suites.

## Skills

`bare — no catalog skill matches TypeScript Pi-extension work; the
conventions live in-repo (AGENTS.md, defensive-boundary doctrine)`

## Workflow

Direct — the preflight retired the unknowns and the Human confirmed the
exact brief on 2026-11-09 ("yes"). The gate owns truth and words; stardeck
owns placement. Grant/approve stay terminal-only; the extension never
stamps anything and never parses `.openspec.yaml` or `schema.yaml` (mtime
statting is cache invalidation, not parsing).

## Slices

### Slice 1 — gate-act resolver, formatter option, extension seam

- [x] `packages/status/src/gate-act.ts`: `resolveGateAct({ change,
      projectRoot, runner, now? })` — contained-path meta stat, mtime-keyed
      cache (30s TTL when stat-less), `runner('pios-gate', ['act', change],
      { cwd: projectRoot, timeoutMs: 2000 })`, first stdout line trimmed,
      any non-zero exit / kill / spawn failure / empty output → `undefined`,
      negatives cached like hits
- [x] `packages/status/src/active-work.ts`: `formatActiveWorkTitle` gains
      `gateAct?: string`; task branch renders
      `change › taskId taskTitle · gate: <act>`; absent gate act →
      byte-identical output; none-mode ignores the option
- [x] `packages/status/index.ts`: `gateAct: { change, line? }` field —
      cleared on focus change, resolved in `refreshOnce` after the commit
      guard (task focus + OpenSpec project only), passed by
      `currentTitleState` only when its change matches the focused change
- [x] `packages/status/test/gate-act.test.ts`: first-line extraction,
      non-zero (incl. exit 2), killed, empty stdout, spawn throw,
      mtime hit skips spawn, mtime change re-probes, vanished meta
      re-probes, stat-less TTL, traversal slug rejected without spawn
- [x] `packages/status/test/active-work.test.ts`: gate beside task,
      absent gate unchanged, none-focus ignores gate, control characters
      stripped
- [x] verify: `npm run check:baseline` (before mutation) · prettier check ·
      `npm run lint` · `npm run typecheck` · `npm run test:status` ·
      `npm run test:stardeck`; then `node scripts/check-baseline.mjs
      --write` and rerun `npm run check:baseline`
- [ ] commit `feat(status): relay gate act beside declared focus` ·
      validation: live session — focused change mid-flow renders both the
      declared task and the gate act verbatim (requires approval + phase
      grants, Human's terminal)

## Verification

Deterministic: the automated checks above. Live (Human): change mid-flow
→ declared task and gate act both render; focus ahead of/behind gate truth
shows the divergence verbatim; no change focused → segment unchanged; gate
binary absent → segment unchanged (unit-proven with a throwing runner).

## History

- 2026-11-09 — drafted from the confirmed brief; preflight findings in
  2-investigate.md; `pios-gate act` live output pending approval (opens
  and grants stay in Human's terminal).
- 2026-11-09 — implemented per the confirmed brief; every automated
  check green (format, lint, typecheck, test:status 160/160,
  test:stardeck 162/162; baseline manifest updated to 106 files,
  passing). Dependency truth: the installed `pios-gate` predates 0.8.1
  — `pios-gate act relay-gate-act-line` exits 1 with `unknown command
  'act'` — so the cockpit renders declared focus alone until the gate
  is upgraded; live act-line verification follows that upgrade. The
  commit step stays unchecked for Human validation.
