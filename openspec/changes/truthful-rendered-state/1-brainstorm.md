# Brainstorm

> Spec: truthful-rendered-state · consult `openspec/learnings/` (absent)

## Pain

1. **Layout violation — openspec bleeds into the left title.**
   `formatActiveWorkTitle` (`packages/status/src/active-work.ts`) paints
   openspec identity (`<change> › <taskId>`, plus the parked relay's
   `· gate:` commentary) into the subject slot. Human layout law
   2026-11-10: openspec-related render lives EXCLUSIVELY on the right;
   the left title/focus is independent of openspec — session name,
   subject, directory fallbacks only.
2. **Work tile pins 0/N on checkbox-less schemas.** `collectOpenSpec`
   (`packages/status/src/openspec.ts`): with no checkbox tasks parsed
   (`tasks.length === 0`), the counter falls back to
   `change.completedTasks/totalTasks` — CLI opinion that cannot count
   custom schemas (spec) and pins at 0/4. File truth already parsed
   above: `status.artifacts[].done` (done = file presence via openspec
   status). Live-caught 2026-11-10: lab cold room, spec schema,
   brainstorm drafted → tile showed "brainstorm 0/4"; truth was 1/4.

## The law

- **Left** — the Human-owned title: session name, subject, directory
  fallbacks; never openspec text. The mirrorsFocus success-coloring
  dies with the law (the subject can never mirror a change anymore).
- **Right** — openspec, exclusively, joined with the deck's own nice
  separators (`⟩` major, `›` minor):

  `<slug> <artifact> #/(count_artifacts) {optional} #/task_counts`

  - `<slug>` — change slug; `<artifact>` — current artifact (first not
    done, else last done)
  - counts — file-truth ladder: checkbox tasks → done/total artifacts
    → nothing; absence never becomes zero
  - fed from title-state work truth (change, currentArtifact, artifact
    done flags, checkbox task counts) — no CLI opinion anywhere

## Questions

- Is `#` a literal glyph before each count pair (`#1/4`), or your
  notation for a done/total pair rendered plainly (`1/4`)?
- What does `{optional}` carry — the gate-act relay re-homed to the
  right (rendered dim), the awaiting-validation marker, or both?
- Separator assignment: minor `›` between segments with a major `⟩`
  before the whole openspec part, or `⟩` throughout?

## Direction

Left = Human-owned title; right = openspec truth, exclusively.
`formatActiveWorkTitle` loses the task branch entirely; the relay's
gate act re-homes to the right side. Verification: with one artifact
drafted in a spec-schema change the right shows `<slug> <artifact>
1/4 …`; the left shows the session name/subject untouched by openspec;
with nothing readable the counts render empty, never 0/N.
