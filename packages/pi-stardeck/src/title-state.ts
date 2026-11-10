/**
 * Deck-side defensive parser for the title-state contract v1
 * (`deck-title-state`, published as the `title` field on
 * `galactica-status:header` with the per-turn `turn` meter beside it).
 *
 * The contract lives in `packages/status/src/title-state.ts`; pi-stardeck
 * keeps this local copy because the deck package carries no npm dependency
 * on the status workspace and consumes it only through the event channel.
 * Bounds mirror the publisher parser exactly: unknown versions and
 * malformed shapes reject the whole object with `null`; parsing never
 * throws, so older publisher events (missing `title`/`turn`) degrade to
 * the legacy selection/activity rendering.
 */

import { compactActivityAge } from './activity-age.ts';

export const DECK_TITLE_STATE_VERSION = 2 as const;

export const DECK_TITLE_ACTIVITY_CLASSES = [
  'editing',
  'reading',
  'grepping',
  'bash',
  'subagent',
] as const;

export type DeckTitleActivityClass = (typeof DECK_TITLE_ACTIVITY_CLASSES)[number];

/** Short target label bound from the accepted schema (Human amendment
 * 2026-10-24: 48 → 120, mirroring the status producer — the deck's
 * render-time width crop owns the real limit now). */
export const DECK_TITLE_TARGET_MAX = 120;

/** Task/step totals bound from the accepted schema. */
export const DECK_TITLE_TOTAL_MAX = 999;

const SUBJECT_MAX = 180;
const IDENTIFIER_MAX = 120;
const TASK_ID_MAX = 32;
const SPAN_ID_MAX = 64;
const WAIVER_ID_MAX = 64;
const NOTICE_MAX = 180;
const ARTIFACTS_MAX = 16;
const GATE_ACT_MAX = 180;
const TURN_TOKENS_MAX = 999_999_999;
const TURN_ELAPSED_MAX = (99 * 60 + 59) * 1_000 + 999;

export type DeckTitleArtifactState = {
  id: string;
  done: boolean;
  items?: { done: number; total: number };
};

export type DeckTitleWorkState = {
  change: string;
  task?: string;
  schemaName?: string;
  artifacts?: DeckTitleArtifactState[];
  /** The artifact the work is in — first not done, else last done. */
  currentArtifact?: string;
  /** Attention facts, derived from publisher-owned truth only. */
  awaitingValidation?: boolean;
  focusAt?: number;
  focusStale?: boolean;
  /** The gate's relayed act line — dim commentary in the optional slot. */
  gateAct?: string;
};

export type DeckTitleActivityState = {
  class: DeckTitleActivityClass;
  target: string;
  span: string;
  parent: string | null;
};

export type DeckTitleWaiverState = { id: string; notice: string };

export type DeckTitleState = {
  v: typeof DECK_TITLE_STATE_VERSION;
  subject: string | null;
  work: DeckTitleWorkState | null;
  activity: DeckTitleActivityState | null;
  waiver: DeckTitleWaiverState | null;
};

/** Per-turn cost meter published beside the title state. */
export type DeckTurnCost = { tokens: number; elapsedMs: number };

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
    value <= DECK_TITLE_TOTAL_MAX
    ? value
    : null;
}

function parseTitleActivity(value: unknown): DeckTitleActivityState | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  const activityClass = DECK_TITLE_ACTIVITY_CLASSES.includes(
    value.class as DeckTitleActivityClass,
  )
    ? (value.class as DeckTitleActivityClass)
    : undefined;
  const target = boundedText(value.target, DECK_TITLE_TARGET_MAX);
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

function parseTitleWork(value: unknown): DeckTitleWorkState | null | undefined {
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
  let artifacts: DeckTitleArtifactState[] | undefined;
  if ('artifacts' in value) {
    if (!Array.isArray(value.artifacts) || value.artifacts.length > ARTIFACTS_MAX) {
      return undefined;
    }
    const parsed: DeckTitleArtifactState[] = [];
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
  const gateAct = boundedText(value.gateAct, GATE_ACT_MAX, { required: false });
  if (gateAct === null) return undefined;
  const extras = {
    ...(schemaName ? { schemaName } : {}),
    ...(artifacts ? { artifacts } : {}),
    ...(currentArtifact ? { currentArtifact } : {}),
    ...(value.awaitingValidation === true ? { awaitingValidation: true } : {}),
    ...(focusAt !== undefined ? { focusAt } : {}),
    ...(value.focusStale === true ? { focusStale: true } : {}),
    ...(gateAct ? { gateAct } : {}),
  };
  return task === undefined ? { change, ...extras } : { change, task, ...extras };
}

function parseTitleWaiver(value: unknown): DeckTitleWaiverState | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  const id = boundedText(value.id, WAIVER_ID_MAX);
  const notice = boundedText(value.notice, NOTICE_MAX);
  if (!id || !notice) return undefined;
  return { id, notice };
}

/**
 * Defensive parser for the published `title` state. Unknown versions,
 * malformed shapes, and out-of-bounds values reject the whole object with
 * `null`; it never throws.
 */
export function parseDeckTitleState(value: unknown): DeckTitleState | null {
  try {
    if (!isRecord(value)) return null;
    if (value.v !== DECK_TITLE_STATE_VERSION) return null;
    const subject = boundedText(value.subject, SUBJECT_MAX, { required: false });
    if (subject === null) return null;
    const work = parseTitleWork(value.work);
    if (work === undefined) return null;
    const activity = parseTitleActivity(value.activity);
    if (activity === undefined) return null;
    const waiver = parseTitleWaiver(value.waiver);
    if (waiver === undefined) return null;
    return {
      v: DECK_TITLE_STATE_VERSION,
      subject: subject ?? null,
      work,
      activity,
      waiver,
    };
  } catch {
    return null;
  }
}

/**
 * Defensive parser for the per-turn cost meter. Non-finite or negative
 * values reject with `null`; it never throws.
 */
export function parseDeckTurnCost(value: unknown): DeckTurnCost | null {
  try {
    if (!isRecord(value)) return null;
    const tokens = value.tokens;
    const elapsedMs = value.elapsedMs;
    if (
      typeof tokens !== 'number' ||
      !Number.isFinite(tokens) ||
      tokens < 0 ||
      tokens > TURN_TOKENS_MAX ||
      typeof elapsedMs !== 'number' ||
      !Number.isFinite(elapsedMs) ||
      elapsedMs < 0 ||
      elapsedMs > TURN_ELAPSED_MAX
    ) {
      return null;
    }
    return { tokens: Math.round(tokens), elapsedMs: Math.floor(elapsedMs) };
  } catch {
    return null;
  }
}

/** One colored piece of the Work label. */
export type DeckWorkSegment = { text: string; color: string; bold?: boolean };

/**
 * The Work label as colored segments — the truthful, de-duplicated tile
 * under the layout law (truthful-rendered-state 2026-11-10):
 * `<slug> › <artifact> <done/total> › gate: <act> › 󰄱 <items>` — the
 * slug leads because openspec identity renders exclusively on the right
 * (the left band is Human-owned title), then current artifact + artifact
 * progress, the gate's relayed act dim in the optional slot, and the
 * current artifact's file-truth item count. Attention is derived, never authored:
 * `⏸ awaiting you` (warning) replaces the whole tile; a stale focus fact
 * (`⚠ focus <age> old`, dim, humanized at render time) replaces the artifact
 * group. Unknown facts drop their segments — absent items never render as
 * zeros. Compact width: the attention/progress side yields first, the item
 * count survives longest. Separators are chrome with hard deck-wide colors —
 * `›` accent like every minor separator.
 */
export function deckWorkSegments(
  work: DeckTitleWorkState,
  now: number = Date.now(),
  compact = false,
): DeckWorkSegment[] {
  if (work.awaitingValidation) {
    return compact ? [] : [{ text: '⏸ awaiting you', color: 'warning' }];
  }
  // The slug leads the right side — openspec identity renders exclusively
  // here (Human layout law 2026-11-10); the left band is Human-owned.
  const segments: DeckWorkSegment[] = [
    { text: work.change, color: 'success', bold: true },
  ];
  const stale = work.focusStale === true && work.focusAt !== undefined;
  if (!compact) {
    if (stale) {
      segments.push({ text: ' › ', color: 'accent' });
      segments.push({
        text: `⚠ focus ${compactActivityAge(Math.max(0, now - (work.focusAt ?? 0)))} old`,
        color: 'dim',
      });
    } else {
      const artifacts = work.artifacts;
      const current = work.currentArtifact;
      if (artifacts && artifacts.length > 0 && current) {
        const done = artifacts.filter((artifact) => artifact.done).length;
        const currentItems = artifacts.find(
          (artifact) => artifact.id === current,
        )?.items;
        const itemsSettled =
          currentItems === undefined ||
          currentItems.total === 0 ||
          currentItems.done >= currentItems.total;
        // One hue per state: success only when the artifacts are done AND
        // the current artifact's items are settled — otherwise work is open.
        const complete = done === artifacts.length && itemsSettled;
        segments.push(
          { text: ' › ', color: 'accent' },
          {
            text: `${current} ${done}/${artifacts.length}`,
            color: complete ? 'success' : 'accent',
          },
        );
      }
    }
    // The {optional} slot: the gate's relayed act — dim commentary that
    // yields first on narrow frames.
    if (work.gateAct) {
      segments.push(
        { text: ' › ', color: 'accent' },
        { text: `gate: ${work.gateAct}`, color: 'dim' },
      );
    }
  }
  const items = work.currentArtifact
    ? work.artifacts?.find((artifact) => artifact.id === work.currentArtifact)?.items
    : undefined;
  if (items && items.total > 0) {
    const complete = items.done >= items.total;
    if (segments.length > 0) {
      segments.push({ text: ' › ', color: 'accent' });
    }
    segments.push({
      text: `${complete ? '✔' : '󰄱'} ${items.done}/${items.total}`,
      color: complete ? 'success' : 'accent',
      ...(complete ? { bold: true } : {}),
    });
  }
  return segments;
}

/** The plain-text Work label — the segment join without colors. */
export function formatDeckWorkLabel(work: DeckTitleWorkState): string {
  return deckWorkSegments(work)
    .map((segment) => segment.text)
    .join('');
}
