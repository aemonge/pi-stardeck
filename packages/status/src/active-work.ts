import { basename } from 'node:path';

export const OPEN_SPEC_FOCUS_ENTRY_TYPE = 'galactica-status.openspec-focus.v1';
export const SESSION_SUBJECT_ENTRY_TYPE = 'galactica-status.session-subject.v1';

export type TaskOpenSpecFocus = {
  mode: 'task';
  change: string;
  taskId: string;
  awaitingValidation: boolean;
};

export type OpenSpecFocus = { mode: 'none' } | TaskOpenSpecFocus;

export const NO_OPEN_SPEC_FOCUS: OpenSpecFocus = { mode: 'none' };

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

export function taskFocus(
  change: unknown,
  taskId: unknown,
  awaitingValidation?: unknown,
): TaskOpenSpecFocus | undefined {
  const normalizedChange = explicitId(change);
  const normalizedTaskId = explicitId(taskId);
  if (!normalizedChange || !normalizedTaskId) return undefined;
  return {
    mode: 'task',
    change: normalizedChange,
    taskId: normalizedTaskId,
    awaitingValidation: awaitingValidation === true,
  };
}

export function parseOpenSpecFocus(value: unknown): OpenSpecFocus | undefined {
  if (!isRecord(value)) return undefined;
  if (value.mode === 'none') return NO_OPEN_SPEC_FOCUS;
  if (value.mode !== 'task') return undefined;
  return taskFocus(value.change, value.taskId, value.awaitingValidation);
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

export function restoreOpenSpecFocus(entries: readonly unknown[]): OpenSpecFocus {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (
      !isRecord(entry) ||
      entry.type !== 'custom' ||
      entry.customType !== OPEN_SPEC_FOCUS_ENTRY_TYPE
    ) {
      continue;
    }
    const focus = parseOpenSpecFocus(entry.data);
    if (focus) return focus;
  }
  return NO_OPEN_SPEC_FOCUS;
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

export function taskflowRunFocus(input: unknown): TaskOpenSpecFocus | undefined {
  if (!isRecord(input) || input.action !== 'run' || !isRecord(input.args)) {
    return undefined;
  }
  const focus = taskFocus(input.args.change, input.args.task);
  return focus && focus.change !== 'none' && focus.taskId !== 'none'
    ? focus
    : undefined;
}

/** Task identity (mode · change · taskId) — the replace-safeguard's
 *  question; the validation flag is state, not identity. */
export function sameTaskFocus(left: OpenSpecFocus, right: OpenSpecFocus): boolean {
  if (left.mode !== right.mode) return false;
  return (
    left.mode === 'none' ||
    (right.mode === 'task' &&
      left.change === right.change &&
      left.taskId === right.taskId)
  );
}

export function sameOpenSpecFocus(left: OpenSpecFocus, right: OpenSpecFocus): boolean {
  if (left.mode !== right.mode) return false;
  return (
    left.mode === 'none' ||
    (right.mode === 'task' &&
      left.change === right.change &&
      left.taskId === right.taskId &&
      left.awaitingValidation === right.awaitingValidation)
  );
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
