import assert from 'node:assert/strict';
import { test } from 'node:test';
import workState from '../index.ts';
import { OPEN_SPEC_FOCUS_ENTRY_TYPE } from '../src/focus.ts';

type Handler = (event: unknown, ctx: unknown) => unknown;

type ToolResult = {
  content: Array<{ type: string; text: string }>;
  details: { ok: boolean; focus: unknown };
};

type FocusTool = {
  name: string;
  label: string;
  description: string;
  promptSnippet: string;
  parameters: unknown;
  execute: (id: string, params: Record<string, unknown>) => Promise<ToolResult>;
};

type TaskFocusShape = {
  mode: string;
  change?: string;
  taskId?: string;
  awaitingValidation?: boolean;
};

function createHarness(entries: unknown[] = []) {
  const handlers = new Map<string, Handler[]>();
  const tools: FocusTool[] = [];
  const emitted: Array<{ event: string; data: unknown }> = [];
  const appended: Array<{ type: string; data: unknown }> = [];
  const branch = entries;
  const pi = {
    appendEntry: (type: string, data: unknown) => {
      appended.push({ type, data });
    },
    events: {
      emit: (event: string, data?: unknown) => {
        emitted.push({ event, data });
      },
      on: () => () => {},
    },
    on: (event: string, handler: Handler) => {
      const list = handlers.get(event) ?? [];
      list.push(handler);
      handlers.set(event, list);
      return () => {};
    },
    registerTool: (tool: FocusTool) => {
      tools.push(tool);
    },
  };
  const ctx = { sessionManager: { getBranch: () => branch } };
  workState(pi as never);
  const fire = (event: string, payload?: unknown) => {
    const results: unknown[] = [];
    for (const handler of handlers.get(event) ?? [])
      results.push(handler(payload, ctx));
    return results;
  };
  return { tools, emitted, appended, fire };
}

function toolOf(harness: ReturnType<typeof createHarness>): FocusTool {
  const tool = harness.tools.find((candidate) => candidate.name === 'openspec_focus');
  assert.ok(tool, 'openspec_focus tool must be registered');
  return tool;
}

function taskShape(focus: unknown): TaskFocusShape {
  return focus as TaskFocusShape;
}

test('the tool block is byte-identical to the Human-approved contract', () => {
  const harness = createHarness();
  const tool = toolOf(harness);
  assert.equal(tool.label, 'OpenSpec Focus');
  assert.equal(
    tool.description,
    'Show, safely set, deliberately replace, validate, or clear branch-local OpenSpec Task focus. Use only for explicit Human direction or an exact declared OpenSpec Task handoff; never infer material Plan selection or Human validation',
  );
  assert.match(tool.promptSnippet, /replacement safeguards/);
  const parameters = tool.parameters as {
    properties: {
      action: { type?: string; enum?: string[]; anyOf?: unknown };
    };
  };
  const action = parameters.properties.action;
  assert.equal(action.type, 'string');
  assert.deepEqual(
    new Set(action.enum),
    new Set(['status', 'set', 'replace', 'validate', 'clear']),
  );
  assert.equal('anyOf' in action, false);
});

test('apply actions write the frozen entry type, update state, and emit per write', async () => {
  const harness = createHarness();
  harness.fire('session_start');
  const tool = toolOf(harness);

  const cleared = await tool.execute('id', { action: 'status' });
  assert.equal(taskShape(cleared.details.focus).mode, 'none');
  assert.equal(cleared.content[0]?.text, 'OpenSpec focus: none');

  const set = await tool.execute('id', {
    action: 'set',
    change: 'pure-renderer-split',
    task: 'execute',
  });
  assert.equal(set.details.ok, true);
  assert.equal(taskShape(set.details.focus).change, 'pure-renderer-split');
  assert.equal(harness.appended.length, 1);
  assert.equal(harness.appended[0]?.type, OPEN_SPEC_FOCUS_ENTRY_TYPE);
  assert.deepEqual(harness.appended[0]?.data, {
    mode: 'task',
    change: 'pure-renderer-split',
    taskId: 'execute',
    awaitingValidation: false,
  });
  assert.equal(harness.emitted.length, 1);
  assert.equal(harness.emitted[0]?.event, 'focus-changed');

  const validated = await tool.execute('id', { action: 'validate' });
  assert.equal(taskShape(validated.details.focus).awaitingValidation, true);
  assert.match(validated.content[0]?.text ?? '', /awaiting Human validation/);
  assert.equal(harness.appended.length, 2);
  assert.equal(harness.emitted.length, 2);

  const clear = await tool.execute('id', { action: 'clear' });
  assert.equal(taskShape(clear.details.focus).mode, 'none');
  assert.equal(clear.content[0]?.text, 'OpenSpec focus cleared');
  assert.equal(harness.appended.length, 3);
  assert.equal(harness.emitted.length, 3);
});

test('set on a different task requires replace; replace changes it deliberately', async () => {
  const harness = createHarness();
  harness.fire('session_start');
  const tool = toolOf(harness);

  await tool.execute('id', { action: 'set', change: 'change-a', task: 'task-1' });
  const conflict = await tool.execute('id', {
    action: 'set',
    change: 'change-b',
    task: 'task-2',
  });
  assert.equal(conflict.details.ok, false);
  assert.equal(conflict.content[0]?.text.startsWith('Error: '), true);
  assert.match(
    conflict.content[0]?.text ?? '',
    /use replace to change it deliberately/,
  );
  assert.equal(harness.appended.length, 1, 'conflict must not write');

  const replace = await tool.execute('id', {
    action: 'replace',
    change: 'change-b',
    task: 'task-2',
  });
  assert.equal(replace.details.ok, true);
  assert.equal(harness.appended.length, 2);
});

test('the taskflow conflict guard blocks conflicting runs with the reworded message', async () => {
  const harness = createHarness();
  harness.fire('session_start');
  await toolOf(harness).execute('id', {
    action: 'set',
    change: 'change-a',
    task: 'task-1',
  });
  harness.appended.length = 0;
  harness.emitted.length = 0;

  const results = harness.fire('tool_call', {
    toolName: 'taskflow',
    input: { action: 'run', args: { change: 'change-b', task: 'task-2' } },
  });
  assert.deepEqual(results[0], {
    block: true,
    reason:
      'OpenSpec focus is change-a › task-1; clear or replace the OpenSpec focus (explicit Human direction) before starting a conflicting run',
  });
  assert.equal(harness.appended.length, 0, 'blocked run must not write');
  assert.equal(harness.emitted.length, 0);
});

test('the guard auto-acquires a non-conflicting run target and ignores other tools', () => {
  const harness = createHarness();
  harness.fire('session_start');

  harness.fire('tool_call', {
    toolName: 'taskflow',
    input: { action: 'run', args: { change: 'change-a', task: 'task-1' } },
  });
  assert.equal(harness.appended.length, 1, 'run target acquired');
  assert.equal(harness.emitted.length, 1);

  harness.fire('tool_call', { toolName: 'read', input: { path: 'x' } });
  assert.equal(harness.appended.length, 1, 'non-taskflow ignored');

  harness.fire('tool_call', {
    toolName: 'taskflow',
    input: { action: 'run', args: { change: 'change-a', task: 'task-1' } },
  });
  assert.equal(harness.appended.length, 1, 'same-focus run is a no-op write');
});

test('restore on session start fails soft over malformed branches', async () => {
  const harness = createHarness(['garbage', null, 42]);
  harness.fire('session_start');
  const status = await toolOf(harness).execute('id', { action: 'status' });
  assert.equal(taskShape(status.details.focus).mode, 'none');
});
