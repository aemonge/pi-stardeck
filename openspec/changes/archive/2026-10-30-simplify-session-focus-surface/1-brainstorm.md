# Brainstorm

> Spec: simplify-session-focus-surface · consult `openspec/learnings/` before drafting

## Pain

The session cockpit exposes four instruments (`work_focus`, `stage`, `subject`, `openspec_focus`) that overlap: three of them compete to describe one focus row, and manual stage declarations duplicate what event inference already derives. In practice the row stays empty: every agent skips the first-turn subject call despite the guideline shipping in the system prompt, and the Human repeatedly screenshots `— no subject / — no change owns the moment`. The Human judges the surface bloated relative to the one authoritative source of work truth: OpenSpec.

## Questions

- Which of the four instruments carry unique signal that inference cannot derive, and which are redundant declarations?
- Where does the "awaiting Human validation" projection live once `work_focus` dies, if OpenSpec derivatives must keep?
- Why do all agents share the first-turn subject fault — is the instruction dead code, buried, or unheard — and which agent-visible channel can actually enforce behavioral rules?
- What must keep parsing old persisted session entries (`session-work.v1`, `session-subject.v1`) after the writer tools are removed, and what fail-soft behavior is required?
- Which external consumers (OpenSpec gate `accountingTools`, the Ramona loop prompt) reference the removed tools, and what lockstep is required outside this repository?
- Does the frozen line-2 deck contract (`deck.ts` Human amendments 2026-10-19/2026-10-23) permit any enforcement change, or must placeholders remain untouched?

<!-- Direction (optional, free): one mutable paragraph of hunch -->
