import { StringEnum } from '@earendil-works/pi-ai';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import {
  NO_OPEN_SPEC_FOCUS,
  OPEN_SPEC_FOCUS_ENTRY_TYPE,
  type OpenSpecFocus,
  restoreOpenSpecFocus,
  sameOpenSpecFocus,
  sameTaskFocus,
  taskflowRunFocus,
  taskFocus,
} from './src/focus.ts';

const FOCUS_CHANGED_EVENT = 'focus-changed';

type OpenSpecFocusAction = 'status' | 'set' | 'replace' | 'validate' | 'clear';

export default function workState(pi: ExtensionAPI): void {
  let currentFocus: OpenSpecFocus = NO_OPEN_SPEC_FOCUS;

  pi.on('session_start', (_event, ctx) => {
    currentFocus = restoreOpenSpecFocus(ctx.sessionManager.getBranch());
  });

  pi.on('session_tree', (_event, ctx) => {
    currentFocus = restoreOpenSpecFocus(ctx.sessionManager.getBranch());
  });

  function persistAndApplyFocus(focus: OpenSpecFocus): void {
    pi.appendEntry(OPEN_SPEC_FOCUS_ENTRY_TYPE, focus);
    currentFocus = focus;
    pi.events.emit(FOCUS_CHANGED_EVENT, focus);
  }

  function applyOpenSpecFocusAction(
    action: OpenSpecFocusAction,
    change?: string,
    taskId?: string,
  ): { ok: boolean; message: string; focus: OpenSpecFocus } {
    const current = currentFocus;
    const statusMessage = (focus: OpenSpecFocus): string =>
      focus.mode === 'task'
        ? `OpenSpec focus: ${focus.change} › ${focus.taskId}` +
          (focus.awaitingValidation ? ' — awaiting Human validation' : '')
        : 'OpenSpec focus: none';

    if (action === 'status') {
      return { ok: true, message: statusMessage(current), focus: current };
    }
    if (action === 'clear') {
      persistAndApplyFocus(NO_OPEN_SPEC_FOCUS);
      return {
        ok: true,
        message: 'OpenSpec focus cleared',
        focus: NO_OPEN_SPEC_FOCUS,
      };
    }
    if (action === 'validate') {
      if (current.mode !== 'task') {
        return {
          ok: false,
          message: 'OpenSpec focus has no task to validate',
          focus: current,
        };
      }
      const validated = { ...current, awaitingValidation: true };
      if (!sameOpenSpecFocus(current, validated)) persistAndApplyFocus(validated);
      return { ok: true, message: statusMessage(validated), focus: validated };
    }

    const requested = taskFocus(change, taskId);
    if (!requested) {
      return {
        ok: false,
        message: 'OpenSpec focus requires non-empty change and task identifiers',
        focus: current,
      };
    }
    if (
      action === 'set' &&
      current.mode === 'task' &&
      !sameTaskFocus(current, requested)
    ) {
      return {
        ok: false,
        message:
          `OpenSpec focus is ${current.change} › ${current.taskId}; ` +
          'use replace to change it deliberately',
        focus: current,
      };
    }
    if (!sameOpenSpecFocus(current, requested)) persistAndApplyFocus(requested);
    return {
      ok: true,
      message: statusMessage(requested),
      focus: requested,
    };
  }

  pi.on('tool_call', (event) => {
    if (event.toolName !== 'taskflow') return;
    const requested = taskflowRunFocus(event.input);

    if (requested) {
      if (currentFocus.mode === 'task' && !sameOpenSpecFocus(currentFocus, requested)) {
        return {
          block: true,
          reason:
            `OpenSpec focus is ${currentFocus.change} › ${currentFocus.taskId}; ` +
            'clear or replace the OpenSpec focus (explicit Human direction) before starting a conflicting run',
        };
      }
      if (!sameOpenSpecFocus(currentFocus, requested)) {
        persistAndApplyFocus(requested);
      }
    }
  });

  pi.registerTool({
    name: 'openspec_focus',
    label: 'OpenSpec Focus',
    description:
      'Show, safely set, deliberately replace, validate, or clear branch-local OpenSpec Task focus. Use only for explicit Human direction or an exact declared OpenSpec Task handoff; never infer material Plan selection or Human validation',
    promptSnippet:
      'Manage exact branch-local OpenSpec Task focus with replacement safeguards',
    parameters: Type.Object({
      action: StringEnum(['status', 'set', 'replace', 'validate', 'clear'] as const),
      change: Type.Optional(
        Type.String({
          description: 'Required for set and replace: the exact OpenSpec change ID',
        }),
      ),
      task: Type.Optional(
        Type.String({
          description: 'Required for set and replace: the exact OpenSpec Task ID',
        }),
      ),
    }),
    async execute(_toolCallId, params) {
      const result = applyOpenSpecFocusAction(
        params.action,
        params.change,
        params.task,
      );
      return {
        content: [
          {
            type: 'text',
            text: result.ok ? result.message : `Error: ${result.message}`,
          },
        ],
        details: {
          ok: result.ok,
          focus: result.focus,
        },
      };
    },
  });
}
