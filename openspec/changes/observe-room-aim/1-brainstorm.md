# Brainstorm

> Spec: observe-room-aim · consult `openspec/learnings/` before drafting
> (absent)

## Pain

1. **Resumed conversation, aimed room, empty deck.** Human aims the room
   from their terminal (`pios-gate <slug>` writes `openspec/.focus`; the
   CLI confirms "focused … · next: …"). A resumed or fresh session carries
   no focus facts, and the cockpit restores focus exclusively from session
   entries (`restoreOpenSpecFocus` mirrored in
   `packages/work-state/src/focus.ts` and
   `packages/status/src/active-work.ts`) — the room aim file is never
   read. Live-caught 2026-11-11: `.focus` aimed at
   `truthful-rendered-state`, deck's right work tile empty.
2. **The gate ladder inside Pi agrees with the deck, not the room.** The
   updated pi-openspec-gate reads attribution focus from session facts
   only, so with none, every unclassified bash call is refused with "no
   active change" even though the room is aimed — the resumed session
   must be re-told what the room already knows (Human's words: not
   setting, not observing).
3. **Two stores, three observers, no law.** The aim lives in
   `openspec/.focus` (CLI verbs), attribution focus in session facts
   (gate extension), deck focus in session facts (work-state/status) —
   three readers over two stores with no precedence rule; drift is the
   default state after every resume.

## Rulings (Human, 2026-11-11)

1. **Observe.** The deck reads `openspec/.focus` directly — no seeding
   into session facts.
2. **One rich store.** Human is consolidating openspec's focus
   informing on `.focus` alone (gate side, their repo) — and the file
   itself goes rich (structured, not a bare slug) so task-level focus
   can live there too. Deck and ladder converge on the same file.
3. **pi-title stays as is** — "it's working fine". This change only
   adds a README note that pi-title is recommended.
4. **Staleness dropped** for aim-driven focus — "focusing on the most
   valuable features". The `⚠ focus N old` warning is not built for
   the aim path (task-focus staleness stays as today, untouched).
5. **Awaiting-you retired** — the deck's lifecycle already answers
   "who's waiting": the agent is either working or awaiting, and the
   Working… indicator says which. The `⏸ awaiting you` state and the
   focus tool's `validate` action retire with the task-focus store
   collapse (no port into the rich file).
6. **Format ratified: flat YAML** — Human's pick confirmed.
7. **`next-step` field** — the gate already computes the pending act
   ("next: read 4-execute.md → pios-gate go"); the rich `.focus`
   persists it as a field, verbs refresh it, and the deck renders it
   from the same single file read. The cockpit's `gate: <act>` spawn
   probe (`gate-act.ts`: CLI subprocess + mtime cache) retires toward
   a plain field read — cheaper, one source of truth.
8. **Schema ratified verbatim** (Human, 2026-11-11):

   ```yaml
   # one active change per room — eospec writes, verbs refresh
   change: truthful-rendered-state
   artifact-name: 4-execute
   artifact-idx: 4/4
   task: 4/12
   next-step: eospec approve
   ```

   The deck tile renders these fields as a pure function of the file —
   every render frame is testable by editing a fixture (Human's point:
   "the tests are extremely easy, since it's just editing such file").
9. **Tile render law (Human, 2026-11-11)** — no vocabulary changes,
   ever: the deck reads the YAML as-is and prints it as-is. No
   prefixes, no relabeling, no mapping into cockpit words. The aimed
   work tile is exactly:

   ```text
   {change} ⟩ {artifact_name} {artifact-idx} › {task} ⟩ {next-step}
   ```

   e.g. `truthful-rendered-state ⟩ 4-execute 4/4 › 4/12 ⟩ eospec
   approve`. The `⟩` major / `›` minor separators carry over from the
   band layout law; the old `gate:` slot prefix and the separate item
   segment are gone — `{next-step}` prints verbatim where the relay
   used to sit, and `{task}` replaces the item counts.

## Questions

- **Writer authority** — the comment says the writer (eospec) owns the
  file, verbs refresh it. The agent's focus tool still needs a lawful
  seam if anything of it survives — gate extension writing on the
  tool's behalf, or nothing writes agent-side at all. Gate repo's
  call; Investigate settles it.
- **Task-id retirement** — the ratified schema carries task *counts*
  (`task: 4/12`) but no task *id*. The `openspec_focus` tool's whole
  set/replace/validate surface is built on `change › task` identity:
  does the tool retire outright with the store it guarded, or shrink
  to something the file can still express? Investigate proposes.
- **Deck-side counting for the aimed change** — with counts carried in
  the file, does the collector's file-truth counting retire for the
  aimed path (render verbatim from `.focus`)? Between-verb staleness
  is accepted (the file is the room's declared progress). Investigate
  proposes, Plan commits.
- **Legacy pins fate** — `config.openspec.change` and
  `PI_OPENSPEC_CHANGE` fall in behind the aim (aim first, pins as
  static fallback) or retire outright. Minor; Investigate settles.

## Direction

Rulings recorded above. Remaining hunch: the deck's aim observation
lands as a small collector-side read with the gate-act mtime-cache
pattern (the cache survives — only the spawn retires); the tile's
`gate:` slot re-sources from the `next-step:` field, same slot, new
well. Writer authority, probe retirement, and pins fate retire at
Investigate.
