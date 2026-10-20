# Idea: The quiet activity row retires when idle

> Human-directed 2026-10-20 after validating the session-id sentinel:
> "can we make this row disappear when 'awaiting Human' and '— · 0
> tok'? That's reserved to activity, so waiting is zero activity,
> right?"

As the package maintainer I want the deck's line-3 band — Activity
left, per-turn cost right — to render only when it speaks, so an idle
frame between turns doesn't spend a whole row (plus its dotted seam)
narrating that nothing is happening.

- Hide exactly when both sides are their idle placeholders: no
  observed activity (`awaiting Human`) and no real turn cost
  (`— · 0 tok` or no meter at all).
- Any real signal keeps the row: a running/editing activity label, or
  a turn that just cost tokens or time (its cost is worth the row
  while awaiting Human review).
