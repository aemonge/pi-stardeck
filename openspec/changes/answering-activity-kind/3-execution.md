# Execution: The answering phase speaks as an activity kind

## Steps

1. Wire unions: `answering` added to HEADER_ACTIVITY_KINDS in
   publisher.ts (done under the Human's declared "do it") and gauge.ts.
2. Label maps (deck.ts, title.ts) + `markAnswering` publishing
   `{kind:'answering'}`.
3. Deck test pinning `answering` + cost → never `awaiting Human`.
4. Gates; commit with the session's three changes for the 0.9.2
   release (Human pushes and publishes).

## Acceptance

Prose streaming renders `answering` with the live meter; settle still
retires the band; both packages' exhaustive maps typecheck.
