# Brainstorm

> Spec: simplify-deck-defaults · consult `openspec/learnings/` before drafting (absent — no learnings recorded yet)

## Pain

The deck narrates states nobody validated: fabricated phase words (`interpreting`, `planning`, `checking`) and a fake `awaiting Human` fill line 3 between tools, while Pi's own `Working…` indicator is suppressed (`setWorkingVisible(false)`) — two voices claiming one truth, and the deck's is the invented one. The focus row still trusts agent goodwill for the title: the first-turn `title` call keeps losing to task attention (verified systematically in simplify-session-focus-surface), so sessions live and die as `— no subject`. And the Work tile froze at `task 0/N` through the whole execution of the last change even as its `4-execute.md` checkboxes ticked — the counts do not come from the artifact the Human actually ticks. On top of the behavior debts, the tree carries the crust of many amendments: three render surfaces in one entrypoint, `deckMode` guards threaded through every publisher, duplicated title-state parsers, and a 50 ms render timer that never sleeps — the code reads like a changelog, not a design.

## Questions

- What should own mid-turn liveness once the deck stops narrating — and what exactly must the deck delete (`setWorkingVisible`, phase words, `awaiting Human`) so Pi's default indicator is the only voice?
- How can the title be guaranteed set without agent cooperation, what sanitizer bounds it, and what must never be overridden (Human-set, agent-set, restored sessions)?
- What does "pure activity band" mean precisely for the line-3 lifecycle — which labels speak (all five observed classes?), what dies (phase words, legacy labels, `awaiting Human`), and when does the band exist at all?
- Where do honest task counts come from when the OpenSpec CLI's done-counting does not track ticks in custom-schema execution artifacts (`4-execute.md`)?
- Which accumulated smells and performance debts can be retired behavior-preserving within this change (dead legacy render path, `deckMode` guard sprawl, timer duty cycle, duplicated parsers), and which are debt to record instead?

<!-- Direction (optional, free): one mutable paragraph of hunch -->
