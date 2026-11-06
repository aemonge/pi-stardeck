import type { OpenSpecFocus, SessionSubject } from './active-work.ts';
import type { OpenSpecState } from './types.ts';

/**
 * Title-state contract v1 (`deck-title-state`).
 *
 * One authoritative object for the deck's upper half: `subject` is authored
 * once, `work` is derived from OpenSpec focus, `activity` is observed from
 * tool executions, and `waiver` suppresses one exact notice text. Rendering
 * code may never write any slot; it only parses defensively.
 */

export const TITLE_STATE_VERSION = 2 as const;

export const TITLE_ACTIVITY_CLASSES = [
  'editing',
  'reading',
  'grepping',
  'bash',
  'subagent',
] as const;

export type TitleActivityClass = (typeof TITLE_ACTIVITY_CLASSES)[number];

/** Short target label bound from the accepted schema (Human amendment
 * 2026-10-24: 48 → 120 — the deck's activity lane now owns the full
 * width beside the turn cluster, so the protocol bound yields to the
 * render-time crop instead of pre-cutting subagent/bash labels). */
export const TITLE_TARGET_MAX = 120;

/** Task/step totals bound from the accepted schema. */
export const TITLE_TOTAL_MAX = 999;

const SUBJECT_MAX = 180;
const IDENTIFIER_MAX = 120;
const TASK_ID_MAX = 32;
const SPAN_ID_MAX = 64;
const WAIVER_ID_MAX = 64;
const NOTICE_MAX = 180;
const ARTIFACTS_MAX = 16;

export type TitleArtifactState = {
  id: string;
  done: boolean;
  items?: { done: number; total: number };
};

export type TitleWorkState = {
  change: string;
  task?: string;
  schemaName?: string;
  artifacts?: TitleArtifactState[];
  /** The artifact the work is in — first not done, else last done. */
  currentArtifact?: string;
  /** Attention facts, derived from publisher-owned truth only. */
  awaitingValidation?: boolean;
  focusAt?: number;
  focusStale?: boolean;
};

export type TitleActivityState = {
  class: TitleActivityClass;
  target: string;
  span: string;
  parent: string | null;
};

export type TitleWaiverState = { id: string; notice: string };

export type TitleState = {
  v: typeof TITLE_STATE_VERSION;
  subject: string | null;
  work: TitleWorkState | null;
  activity: TitleActivityState | null;
  waiver: TitleWaiverState | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function boundedText(
  value: unknown,
  maximum: number,
  { required = true }: { required?: boolean } = {},
): string | null | undefined {
  if (value === null || value === undefined) return required ? null : undefined;
  if (typeof value !== 'string') return null;
  const points = Array.from(value.replace(/\s+/gu, ' ').trim());
  if (points.length === 0) return null;
  if (points.length > maximum) return null;
  return points.join('');
}

function boundedTotal(value: unknown): number | null {
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= TITLE_TOTAL_MAX
    ? value
    : null;
}

function parseTitleActivity(value: unknown): TitleActivityState | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  const activityClass = TITLE_ACTIVITY_CLASSES.includes(
    value.class as TitleActivityClass,
  )
    ? (value.class as TitleActivityClass)
    : undefined;
  const target = boundedText(value.target, TITLE_TARGET_MAX);
  const span = boundedText(value.span, SPAN_ID_MAX);
  let parent: string | null | undefined;
  if (value.parent === null) parent = null;
  else if (typeof value.parent === 'string') {
    const normalized = boundedText(value.parent, SPAN_ID_MAX);
    parent = normalized === null ? undefined : normalized;
  } else parent = undefined;
  if (!activityClass || !target || !span || parent === undefined) return undefined;
  return { class: activityClass, target, span, parent };
}

function parseTitleWork(value: unknown): TitleWorkState | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  const change = boundedText(value.change, IDENTIFIER_MAX);
  if (!change) return undefined;
  const task = boundedText(value.task, TASK_ID_MAX, { required: false });
  if (task === null) return undefined;
  const schemaName = boundedText(value.schemaName, IDENTIFIER_MAX, {
    required: false,
  });
  if (schemaName === null) return undefined;
  const currentArtifact = boundedText(value.currentArtifact, TASK_ID_MAX, {
    required: false,
  });
  if (currentArtifact === null) return undefined;
  let artifacts: TitleArtifactState[] | undefined;
  if ('artifacts' in value) {
    if (!Array.isArray(value.artifacts) || value.artifacts.length > ARTIFACTS_MAX) {
      return undefined;
    }
    const parsed: TitleArtifactState[] = [];
    for (const entry of value.artifacts) {
      if (!isRecord(entry)) return undefined;
      const id = boundedText(entry.id, TASK_ID_MAX);
      if (!id) return undefined;
      if (typeof entry.done !== 'boolean') return undefined;
      const artifactDone = entry.done;
      let items: { done: number; total: number } | undefined;
      if ('items' in entry) {
        if (!isRecord(entry.items)) return undefined;
        const done = boundedTotal(entry.items.done);
        const total = boundedTotal(entry.items.total);
        if (done === null || total === null) return undefined;
        items = { done, total };
      }
      parsed.push({ id, done: artifactDone, ...(items ? { items } : {}) });
    }
    artifacts = parsed;
  }
  if ('awaitingValidation' in value && typeof value.awaitingValidation !== 'boolean') {
    return undefined;
  }
  let focusAt: number | undefined;
  if ('focusAt' in value) {
    if (
      typeof value.focusAt !== 'number' ||
      !Number.isSafeInteger(value.focusAt) ||
      value.focusAt < 0
    ) {
      return undefined;
    }
    focusAt = value.focusAt;
  }
  if ('focusStale' in value && typeof value.focusStale !== 'boolean') {
    return undefined;
  }
  const extras = {
    ...(schemaName ? { schemaName } : {}),
    ...(artifacts ? { artifacts } : {}),
    ...(currentArtifact ? { currentArtifact } : {}),
    ...(value.awaitingValidation === true ? { awaitingValidation: true } : {}),
    ...(focusAt !== undefined ? { focusAt } : {}),
    ...(value.focusStale === true ? { focusStale: true } : {}),
  };
  return task === undefined ? { change, ...extras } : { change, task, ...extras };
}

function parseTitleWaiver(value: unknown): TitleWaiverState | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  const id = boundedText(value.id, WAIVER_ID_MAX);
  const notice = boundedText(value.notice, NOTICE_MAX);
  if (!id || !notice) return undefined;
  return { id, notice };
}

/**
 * Defensive parser for incoming title-state payloads. Unknown versions,
 * malformed shapes, and out-of-bounds values (target > 120 characters,
 * totals > 999) reject the whole object with `null`; it never throws.
 */
export function parseTitleState(value: unknown): TitleState | null {
  try {
    if (!isRecord(value)) return null;
    if (value.v !== TITLE_STATE_VERSION) return null;
    const subject = boundedText(value.subject, SUBJECT_MAX, { required: false });
    if (subject === null) return null;
    const work = parseTitleWork(value.work);
    if (work === undefined) return null;
    const activity = parseTitleActivity(value.activity);
    if (activity === undefined) return null;
    const waiver = parseTitleWaiver(value.waiver);
    if (waiver === undefined) return null;
    return {
      v: TITLE_STATE_VERSION,
      subject: subject ?? null,
      work,
      activity,
      waiver,
    };
  } catch {
    return null;
  }
}

/** Collapse whitespace and shorten a live target label to the schema bound. */
export function shortenTitleTarget(value: string): string {
  const points = Array.from(value.replace(/\s+/gu, ' ').trim());
  if (points.length <= TITLE_TARGET_MAX) return points.join('');
  return `${points.slice(0, Math.max(1, TITLE_TARGET_MAX - 1)).join('')}…`;
}

/**
 * Derive the `work` slot from the OpenSpec focus and the focused snapshot.
 * A task focus owns its change; without a focus a passively collected change
 * still reports artifact facts, just without a task id. Counts live only on
 * artifact `items` — file truth; absent counts are absent, never zeros.
 */
export function deriveTitleWork(
  focus: OpenSpecFocus,
  openspec: OpenSpecState | null | undefined,
  options: { focusAt?: number } = {},
): TitleWorkState | null {
  // Artifact facts come straight from the collector; nothing is invented
  // here — absent facts simply drop out of the contract.
  const extras = (state: OpenSpecState | undefined) => {
    if (!state) return {};
    return {
      ...(state.schemaName ? { schemaName: state.schemaName } : {}),
      ...(state.artifacts ? { artifacts: state.artifacts } : {}),
      ...(state.currentArtifact ? { currentArtifact: state.currentArtifact } : {}),
    };
  };
  if (focus.mode === 'task') {
    const state = openspec && openspec.changeId === focus.change ? openspec : undefined;
    const stale =
      options.focusAt !== undefined &&
      state?.changeModifiedAt !== undefined &&
      state.changeModifiedAt > options.focusAt;
    return {
      change: focus.change,
      task: focus.taskId,
      ...extras(state),
      ...(focus.awaitingValidation ? { awaitingValidation: true } : {}),
      ...(options.focusAt !== undefined ? { focusAt: options.focusAt } : {}),
      ...(stale ? { focusStale: true } : {}),
    };
  }
  if (!openspec) return null;
  return { change: openspec.changeId, ...extras(openspec) };
}

/**
 * Build the v1 title state from publisher-owned facts: the authored session
 * subject entry, the OpenSpec focus (plus its snapshot), and the newest
 * observed activity event. The waiver slot stays null until the notice slice.
 */
export function buildTitleState(options: {
  subject: SessionSubject;
  focus: OpenSpecFocus;
  openspec?: OpenSpecState | null;
  activity?: TitleActivityState | null;
  /** Publisher-owned timestamp of the current focus fact. */
  focusAt?: number;
}): TitleState {
  return {
    v: TITLE_STATE_VERSION,
    subject: options.subject.state === 'set' ? options.subject.title : null,
    work: deriveTitleWork(options.focus, options.openspec, {
      focusAt: options.focusAt,
    }),
    activity: options.activity ?? null,
    waiver: null,
  };
}

/** Checkpoint line for `/galactica-status-debug`: the live title-state JSON. */
export function titleStateDebugLine(title: TitleState): string {
  return `title-state: ${JSON.stringify(title)}`;
}
