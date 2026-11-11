import type { LedgerEvent } from './ledger.ts';
import type { SessionSubject } from './active-work.ts';
import type {
  CockpitSnapshot,
  ProgressFact,
  RunSpan,
  SelectionState,
  StageValue,
} from './types.ts';

/**
 * Pure reducer for the cockpit status core (frozen contract).
 *
 * The reducer is the only writer of snapshot state. Selection priority lives in
 * exactly one resolver. Title and stage are derived projections, never stored
 * facts. Placeholder rendering is structurally impossible here: absent facts
 * produce absent slots, never sentinel dashes or narration.
 */

export type ReducerFacts = {
  subject: SessionSubject;
  runs: ReadonlyMap<string, RunSpan>;
  progress: ProgressFact | null;
};

export const NO_SELECTION: SelectionState = { kind: 'none' };

export function emptyFacts(): ReducerFacts {
  return {
    subject: { state: 'clear' },
    runs: new Map(),
    progress: null,
  };
}

/** The single selection resolver. Priority order is contract-frozen. */
export function resolveSelection(facts: { subject: SessionSubject }): SelectionState {
  if (facts.subject.state === 'set') {
    return { kind: 'subject', title: facts.subject.title };
  }
  return NO_SELECTION;
}

function applyStageRule(span: RunSpan, stage: StageValue, declared: boolean): RunSpan {
  // Declaration beats inference: an inferred stage never overrides a declared one.
  if (!declared && span.stageDeclared) return span;
  return { ...span, stage, stageDeclared: declared };
}

export function applyEvent(facts: ReducerFacts, event: LedgerEvent): ReducerFacts {
  switch (event.type) {
    case 'focus/subject':
      return { ...facts, subject: event.subject };
    case 'run/start': {
      const runs = new Map(facts.runs);
      runs.set(event.span.id, event.span);
      return { ...facts, runs };
    }
    case 'run/stage': {
      const span = facts.runs.get(event.id);
      if (!span || span.endedAt !== undefined) return facts;
      const runs = new Map(facts.runs);
      runs.set(event.id, applyStageRule(span, event.stage, event.declared));
      return { ...facts, runs };
    }
    case 'run/end': {
      const span = facts.runs.get(event.id);
      if (!span || span.endedAt !== undefined) return facts;
      const runs = new Map(facts.runs);
      runs.set(event.id, { ...span, endedAt: event.at });
      return { ...facts, runs };
    }
    case 'progress/refresh':
      return { ...facts, progress: event.progress };
    case 'diagnostics/refresh':
    case 'orchestration/refresh':
    case 'taskflow/phase':
      // Bounded collector domains feed the same ledger path but never the
      // selection; snapshot consumers read them through their own projections.
      return facts;
  }
}

/** Fold a full ledger into one snapshot. Pure; version counts applied events. */
export function reduceLedger(events: readonly LedgerEvent[]): CockpitSnapshot {
  let facts = emptyFacts();
  for (const event of events) {
    facts = applyEvent(facts, event);
  }
  return snapshotFromFacts(facts, events.length);
}

export function snapshotFromFacts(
  facts: ReducerFacts,
  version: number,
): CockpitSnapshot {
  const runs = [...facts.runs.values()].sort((left, right) => {
    if (left.since !== right.since) return left.since - right.since;
    return left.id < right.id ? -1 : 1;
  });
  return {
    version,
    selection: resolveSelection(facts),
    runs,
    progress: facts.progress,
  };
}

/** Root run of the current turn, if any (the direct agent). */
export function rootRun(snapshot: CockpitSnapshot): RunSpan | undefined {
  return snapshot.runs.find((span) => span.kind === 'agent' && span.parent === null);
}

/** Derived stage: the root run's stage, or listening when nothing runs. */
export function derivedStage(snapshot: CockpitSnapshot): StageValue {
  return rootRun(snapshot)?.stage ?? 'listening';
}
