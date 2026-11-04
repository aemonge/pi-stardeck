export const OPEN_SPEC_FOCUS_ENTRY_TYPE = 'galactica-status.openspec-focus.v1';

export type TaskOpenSpecFocus = {
  mode: 'task';
  change: string;
  taskId: string;
  awaitingValidation: boolean;
};

export type OpenSpecFocus = { mode: 'none' } | TaskOpenSpecFocus;

export const NO_OPEN_SPEC_FOCUS: OpenSpecFocus = { mode: 'none' };

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/gu;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
 * question; the validation flag is state, not identity. */
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
