# Plan: z.ai quota provider

## Scope

`packages/footer` only — the deck already parses `quotaWindows`
(gauge.ts) and renders both windows; nothing renderer-side changes
(deck-corner-context relocates their homes independently).

## Current state (verified)

- `quota.ts`: `QuotaSnapshot { percent }`, empty provider registry,
  `registerQuotaProvider`/`activeQuotaProviders` seam.
- `protocol.ts`: `FooterTelemetryMessage` carries `quotaPercent?` only —
  `quotaWindows?` is absent; `buildFooterTelemetryMessage(totalCost,
  quota?)` maps percent and omits absent quota fields.
- Deck `gauge.ts:179-180` already accepts `quotaPercent?` and
  `quotaWindows?: FooterQuotaWindow[]` on the wire — the consumer side is
  done and gated.

## Design decisions

1. **Windows on the seam** — `QuotaSnapshot` gains
   `windows?: Array<{ label; percent; resetAt? }>`; `FooterTelemetryMessage`
   gains `quotaWindows?`; `buildFooterTelemetryMessage` passes both
   through when finite and 0–100-bounded. Protocol version stays 1
   (additive optional field; the deck tolerates absence today).
2. **z.ai module** — new `packages/footer/src/quota-zai.ts`: key from
   `~/.pi/agent/auth.json` (`zai.key`, `${ENV}` expansion), fetch the
   quota endpoint with Bearer auth, normalize the envelope per the
   clean-room facts (skip `TIME*`, percentage or currentValue/usage,
   sort by reset, label 5h/7d by type-then-distance), clamp 0–100.
3. **Fail-soft** — missing key, non-OK response, or unparseable envelope
   returns `undefined` from `snapshot()`; one debug line per distinct
   failure mode; no retries, no error surfacing.
4. **Cadence** — refresh on session start, on model change, and on a
   5-minute interval; the last successful snapshot is cached between
   ticks so a transient failure never blanks a lit gauge.
5. **Registry discipline** — the provider registers under id `zai`;
   Codex/Claude land later as sibling registrations (extension, not
   modification).

## Risks

- Envelope drift on z.ai's side → fail-soft keeps the deck dark; unit
  tests pin the known shape so drift is visible in CI only if the
  fixtures change.
- `${ENV}` expansion must match pi auth semantics exactly; covered by
  unit tests (literal, `${VAR}`, missing var).

## Checks

- `npm test` scoped to packages/footer (envelope, expansion, protocol
  plumbing)
- Full `npm run check` battery; `check-baseline --write`; `graphify
  update .`
- Host validation with a real key: flame + countdown in the corner,
  `7d` calendar on line 4, no error spam
