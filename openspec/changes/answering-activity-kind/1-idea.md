# Idea: The answering phase speaks as an activity kind

> Human-directed 2026-10-20 during live re-validation, catching the
> exact frame the first review called LOW: while a turn streams visible
> prose, `markAnswering` cleared the live activity projection, so the
> band read `awaiting Human` beside `this turn 431.0k · 0:43` —
> "Awaiting human, where thinking was the deal."

As the package maintainer I want the answering phase to publish as a
first-class activity kind (`answering`), so every moment of a live
turn — thinking, tool gaps, and prose streaming alike — renders an
honest label, and `awaiting Human` appears only once the turn truly
settles.

- Additive wire change: `answering` joins `HEADER_ACTIVITY_KINDS` on
  both sides (status publisher + deck gauge) in the same release.
- Both exhaustive label maps learn it; `markAnswering` publishes
  `{kind: 'answering'}` instead of clearing the projection.
