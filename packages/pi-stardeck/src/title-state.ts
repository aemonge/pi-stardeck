/**
 * Deck-side defensive parser for the title-state contract v2
 * (`deck-title-state`, published as the `title` field on
 * `galactica-status:header`).
 *
 * The contract lives in `packages/status/src/title-state.ts`; pi-stardeck
 * keeps this local copy because the deck package carries no npm dependency
 * on the status workspace and consumes it only through the event channel.
 * Bounds mirror the publisher parser exactly: unknown versions and
 * malformed shapes reject the whole object with `null`; parsing never
 * throws, so older publisher events (missing `title`) degrade to the
 * legacy selection rendering. The per-turn `turn` meter and the observed
 * `activity` field are retired here (simplify-deck-band): the deck ignores
 * both — the workspace loader owns the time story and nothing renders the
 * activity line — while malformed activity payloads no longer reject the
 * title.
 */

export const DECK_TITLE_STATE_VERSION = 2 as const;

/** Short target label bound from the accepted schema (Human amendment
 * 2026-10-24: 48 → 120, mirroring the status producer — the deck's
 * render-time width crop owns the real limit now). Kept exported for
 * contract parity even though the activity target it bounded is no
 * longer rendered. */
export const DECK_TITLE_TARGET_MAX = 120;

const SUBJECT_MAX = 180;
const IDENTIFIER_MAX = 120;
const TASK_ID_MAX = 32;
const WAIVER_ID_MAX = 64;
const NOTICE_MAX = 180;

export type DeckTitleWorkState = {
  change: string;
  /** Room-aim verbatim fields (observe-room-aim render law): printed
   * as-is — the deck is a printer, not a translator. */
  artifactName?: string;
  artifactIdx?: string;
  task?: string;
  nextStep?: string;
};

export type DeckTitleWaiverState = { id: string; notice: string };

export type DeckTitleState = {
  v: typeof DECK_TITLE_STATE_VERSION;
  subject: string | null;
  work: DeckTitleWorkState | null;
  waiver: DeckTitleWaiverState | null;
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

function parseTitleWork(value: unknown): DeckTitleWorkState | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  const change = boundedText(value.change, IDENTIFIER_MAX);
  if (!change) return undefined;
  const artifactName = boundedText(value.artifactName, IDENTIFIER_MAX, {
    required: false,
  });
  if (artifactName === null) return undefined;
  const artifactIdx = boundedText(value.artifactIdx, TASK_ID_MAX, {
    required: false,
  });
  if (artifactIdx === null) return undefined;
  const task = boundedText(value.task, TASK_ID_MAX, { required: false });
  if (task === null) return undefined;
  const nextStep = boundedText(value.nextStep, NOTICE_MAX, { required: false });
  if (nextStep === null) return undefined;
  return {
    change,
    ...(artifactName ? { artifactName } : {}),
    ...(artifactIdx ? { artifactIdx } : {}),
    ...(task ? { task } : {}),
    ...(nextStep ? { nextStep } : {}),
  };
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
    const waiver = parseTitleWaiver(value.waiver);
    if (waiver === undefined) return null;
    return {
      v: DECK_TITLE_STATE_VERSION,
      subject: subject ?? null,
      work,
      waiver,
    };
  } catch {
    return null;
  }
}

/** One colored piece of the Work label. */
export type DeckWorkSegment = { text: string; color: string; bold?: boolean };

/**
 * The Work label as colored segments — the render law (observe-room-aim
 * 2026-11-11), the room aim printed verbatim:
 *
 * `{change} ⟩ {artifact_name} {artifact-idx} › {task} ⟩ {next-step}`
 *
 * Read as-is, printed as-is: the deck is a printer, not a translator.
 * No prefixes, no relabeling, no mapping into cockpit words. A missing
 * field drops its segment and the separator that led it; absence never
 * becomes zero. Compact width yields the dim `next-step` first —
 * identity and progress survive longest. Separators are chrome with
 * hard deck-wide colors — `›` accent like every minor separator.
 */
/** The OpenSpec mark — nf-md file-document-outline. One constant: the
 * glyph is a taste choice, the placement is law (both lines). */
export const OPEN_SPEC_ICON = '󰈙';

export function deckWorkSegments(
  work: DeckTitleWorkState,
  compact = false,
): DeckWorkSegment[] {
  // Human amendment (reorder-deck-frame, 2026-11-11): the slug moved to
  // the engine row — the focus spec's home. Line 2 carries the progress
  // fields and the green action hint (Human-directed 2026-11-11,
  // move-warning-below-prompt slice 2):
  // `{icon} {artifact_name} {artifact-idx} › {task} ⟩ {next-step}` — read
  // as-is, printed as-is; the icon leads the first rendered segment; the
  // green hint yields first on narrow frames.
  const segments: DeckWorkSegment[] = [];
  let iconPending = true;
  const lead = (segment: DeckWorkSegment): void => {
    if (iconPending) {
      iconPending = false;
      segments.push({ ...segment, text: `${OPEN_SPEC_ICON} ${segment.text}` });
      return;
    }
    segments.push(segment);
  };
  if (work.artifactName) {
    lead({
      text: work.artifactIdx
        ? `${work.artifactName} ${work.artifactIdx}`
        : work.artifactName,
      color: 'accent',
    });
  }
  if (work.task) {
    // A separator only follows a segment — a leading one dangles.
    if (segments.length > 0) {
      segments.push({ text: ' › ', color: 'accent' });
    }
    lead({ text: work.task, color: 'accent' });
  }
  if (work.nextStep && !compact) {
    if (segments.length > 0) segments.push({ text: ' ⟩ ', color: 'accent' });
    lead({ text: work.nextStep, color: 'success' });
  }
  return segments;
}

/** The plain-text Work label — the segment join without colors. */
export function formatDeckWorkLabel(work: DeckTitleWorkState): string {
  return deckWorkSegments(work)
    .map((segment) => segment.text)
    .join('');
}
