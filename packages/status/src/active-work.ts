import { basename } from 'node:path';

export const SESSION_SUBJECT_ENTRY_TYPE = 'galactica-status.session-subject.v1';

export type SessionSubject = { state: 'clear' } | { state: 'set'; title: string };

export const NO_SESSION_SUBJECT: SessionSubject = { state: 'clear' };

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/gu;
const MAX_TITLE_POINTS = 180;
const MAX_SUBJECT_POINTS = 120;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function shorten(value: string, maximum: number): string {
  const points = Array.from(value);
  if (points.length <= maximum) return value;
  return `${points.slice(0, Math.max(1, maximum - 1)).join('')}…`;
}

export function normalizeTitlePart(value: string): string {
  return value.replace(CONTROL_CHARACTERS, ' ').replace(/\s+/gu, ' ').trim();
}

function explicitId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = normalizeTitlePart(value);
  return normalized || undefined;
}

export function sessionSubject(
  state: unknown,
  title?: unknown,
): SessionSubject | undefined {
  if (state === 'clear') return NO_SESSION_SUBJECT;
  if (state !== 'set') return undefined;
  const normalizedTitle = explicitId(title);
  if (!normalizedTitle) return undefined;
  return {
    state,
    title: shorten(normalizedTitle, MAX_SUBJECT_POINTS),
  };
}

export function parseSessionSubject(value: unknown): SessionSubject | undefined {
  if (!isRecord(value)) return undefined;
  return sessionSubject(value.state, value.title);
}

export function restoreSessionSubject(entries: readonly unknown[]): SessionSubject {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (
      !isRecord(entry) ||
      entry.type !== 'custom' ||
      entry.customType !== SESSION_SUBJECT_ENTRY_TYPE
    ) {
      continue;
    }
    const subject = parseSessionSubject(entry.data);
    if (subject) return subject;
  }
  return NO_SESSION_SUBJECT;
}

export function sameSessionSubject(
  left: SessionSubject,
  right: SessionSubject,
): boolean {
  if (left.state !== right.state) return false;
  return (
    left.state === 'clear' || (right.state === 'set' && left.title === right.title)
  );
}

/**
 * The Human-owned left title: session name, subject, then the directory
 * fallbacks. Layout law 2026-11-10 (truthful-rendered-state): openspec
 * identity renders exclusively on the right work tile — this chain never
 * carries change, task, or gate text.
 */
export function formatActiveWorkTitle(options: {
  subject?: SessionSubject;
  sessionName?: string;
  projectRoot?: string;
  cwd: string;
}): string {
  const detail =
    normalizeTitlePart(options.sessionName ?? '') ||
    (options.subject && options.subject.state === 'set' ? options.subject.title : '') ||
    normalizeTitlePart(basename(options.projectRoot ?? '')) ||
    normalizeTitlePart(basename(options.cwd)) ||
    'pi';

  // Bare text — line 2 carries no chrome (frozen amendment): the title
  // stands naked, and pi-title's naming is quoted, never re-decorated.
  return shorten(detail, MAX_TITLE_POINTS);
}
