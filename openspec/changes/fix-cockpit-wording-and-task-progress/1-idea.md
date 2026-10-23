# Idea: honest task progress and cockpit-free agent wording

## Pain

Every agent session in this repository is injected with "cockpit" wording:
`AGENTS.md` — the repository instructions each session receives — still says
"the Human-validated cockpit" and "The package owns the visible Pi cockpit",
and the health check can warn "duplicate cockpit commands detected". That is
stale Galactica-era naming for a product whose identity is pi-stardeck, the
command deck, and it leaks into agent reasoning in every session. Separately,
the footer's focused-change row shows `0/0` task progress while the focused
change actually holds real progress (`4/7` observed), so the human's glance at
the bridge lies about the state of work.

## Questions

What-questions (for drafted requirements to answer):

- Which surfaces count as agent-facing for the wording fix — `AGENTS.md` alone,
  or also README, `package.json` keywords, and exported source identifiers?
- Which source is authoritative for task counts — the OpenSpec CLI JSON
  (`list`, `instructions apply`) or the tasks ledger file itself?
- Must older mission-era task formats keep parsing alongside the renamed
  `spec` schema?

How-might-we questions (for research to answer):

- How might the deck compute task progress from the current `spec`-schema
  artifacts (numbered steps, per-Slice tasks with Human validation) so counts
  never read `0/0` while work exists?
- How might the cockpit metaphor be retired without breaking public API
  identifiers, historical commit references, or baseline checksums?
