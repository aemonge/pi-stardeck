# Brainstorm

> Spec: redesign-deck-title-band · consult `openspec/learnings/` before drafting (absent)

## Pain

The deck's line 2 renders untruthful and duplicated facts:

`π • polish-upload-validations › 8-1     polish-upload-validations ⟩ 4/4 execute › 󰄱 0/0`

- The change name appears twice (subject side and Work tile).
- `0/0` renders when task counting fails: `openspec list` reports
  `completedTasks: 0, totalTasks: 0, status: "no-tasks"` for every local
  spec-schema change and `instructions apply` reports `tasks: []` with
  `taskTrackingConfigured: false` — the CLI structurally cannot count items
  for custom-schema artifacts, and `boundedCount` fallbacks coerce that
  absence into zeros.
- Task IDs render without their titles (the lookup finds nothing because the
  same broken counting emptied `allTasks`).
- Artifact vocabulary says "ladder"/"rung"; the facts are artifacts.
- The `π • ` prefix violates the frozen line-2 amendment (no chrome).

## Questions

- Where does the tile's item count come from if the CLI cannot count? (File
  truth: the current artifact's own file, parsed checkboxes, cached by mtime.)
- How does absence stay expressible end-to-end so `0/0` can never render
  again? (Parsers return `undefined`; renderers hide unknown segments.)
- Where do the attention facts (`awaitingValidation`, staleness vs the
  change's last file modification) live on the contract, and who computes
  each? (Publisher owns fs + focus timestamps; deck humanizes age at render.)
- What replaces the tile when the change name is dropped and every fact is
  absent? (Empty tile — the subject side already names the change.)

<!-- Direction (optional, free): one mutable paragraph of hunch -->

The Human-approved brief (2026-11-06) fixed the shape: file-truth checkbox
counting with an mtime cache, `ladder`→`artifacts` + `rung`→`currentArtifact`
renames, honest absence everywhere, a de-duplicated Work tile driven by
current artifact + artifact progress + item count, fact-derived attention
states (`⏸ awaiting you`, `⚠ focus <age> old`), the `π • ` prefix removed,
and a width policy where progress/attention yields before the item count.
Discovery confirmed every assumption against live CLI output; the counter
may proceed.
