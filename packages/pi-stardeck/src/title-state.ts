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

export const DECK_TITLE_STATE_VERSION = 1 as const;

export const DECK_TITLE_ACTIVITY_CLASSES = [
  'editing',
  'reading',
  'grepping',
  'bash',
  'subagent',
] as const;

export type DeckTitleActivityClass = (typeof DECK_TITLE_ACTIVITY_CLASSES)[number];

/** Short target label bound from the accepted schema. */
export const DECK_TITLE_TARGET_MAX = 48;

/** Task/step totals bound from the accepted schema. */
export const DECK_TITLE_TOTAL_MAX = 999;

const SUBJECT_MAX = 180;
const IDENTIFIER_MAX = 120;
const TASK_ID_MAX = 32;
const SPAN_ID_MAX = 64;
const WAIVER_ID_MAX = 64;
const NOTICE_MAX = 180;
const TURN_TOKENS_MAX = 999_999_999;
const TURN_ELAPSED_MAX = (99 * 60 + 59) * 1_000 + 999;

export type DeckTitleWorkState = {
  change: string;
  task?: string;
  done?: number;
  total?: number;
  schemaName?: string;
  ladder?: { done: number; total: number; rung?: string };
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
  // Counts are optional as a pair: absent means unknown (never fabricated
  // zeros); present-but-invalid rejects the object.
  const hasCounts = 'done' in value && 'total' in value;
  if ('done' in value !== 'total' in value) return undefined;
  const boundedDone = hasCounts ? boundedTotal(value.done) : undefined;
  const boundedTotalValue = hasCounts ? boundedTotal(value.total) : undefined;
  if (hasCounts && (boundedDone === null || boundedTotalValue === null)) {
    return undefined;
  }
  const task = boundedText(value.task, TASK_ID_MAX, { required: false });
  if (task === null) return undefined;
  const schemaName = boundedText(value.schemaName, IDENTIFIER_MAX, {
    required: false,
  });
  if (schemaName === null) return undefined;
  let ladder: { done: number; total: number; rung?: string } | undefined;
  if ('ladder' in value) {
    if (!isRecord(value.ladder)) return undefined;
    const ladderDone = boundedTotal(value.ladder.done);
    const ladderTotal = boundedTotal(value.ladder.total);
    if (ladderDone === null || ladderTotal === null) return undefined;
    const ladderRung = boundedText(value.ladder.rung, 32, { required: false });
    if (ladderRung === null) return undefined;
    ladder = {
      done: ladderDone,
      total: ladderTotal,
      ...(ladderRung ? { rung: ladderRung } : {}),
    };
  }
  const counts =
    typeof boundedDone === 'number' && typeof boundedTotalValue === 'number'
      ? { done: boundedDone, total: boundedTotalValue }
      : {};
  const extras = {
    ...(schemaName ? { schemaName } : {}),
    ...(ladder ? { ladder } : {}),
  };
  return task === undefined
    ? { change, ...counts, ...extras }
    : { change, task, ...counts, ...extras };
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
 * The Work label as colored segments — the human-chosen design: `change ⟩
 * done/total rung › 󰄱 done/total` in one hue per state (accent, success at
 * complete with a filled checkbox and bold counts). The rung name comes
 * straight from OpenSpec's status artifacts — never an invented phase
 * word. Separators are chrome with hard deck-wide colors — `⟩`
 * thinkingHigh-bold like every semantic separator, `›` accent like every
 * minor one. Unknown facts degrade honestly; the bare change is the floor.
 */
export function deckWorkSegments(work: DeckTitleWorkState): DeckWorkSegment[] {
  const complete =
    work.done !== undefined &&
    work.total !== undefined &&
    work.total > 0 &&
    work.done >= work.total;
  const base = complete ? 'success' : 'accent';
  const segments: DeckWorkSegment[] = [{ text: work.change, color: base }];
  const ladder = work.ladder;
  if (ladder) {
    segments.push({ text: ' ⟩ ', color: 'thinkingHigh', bold: true });
    const group = `${ladder.done}/${ladder.total}${ladder.rung ? ` ${ladder.rung}` : ''}`;
    segments.push({ text: group, color: base });
  }
  if (work.done !== undefined && work.total !== undefined) {
    segments.push({ text: ' › ', color: 'accent' });
    segments.push({
      text: `${complete ? '✔' : '󰄱'} ${work.done}/${work.total}`,
      color: base,
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
