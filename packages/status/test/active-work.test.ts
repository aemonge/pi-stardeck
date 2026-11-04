import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { after, before } from 'node:test';
import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';
import galacticaStatus from '../index.ts';
import {
  formatActiveWorkTitle,
  NO_SESSION_SUBJECT,
  OPEN_SPEC_FOCUS_ENTRY_TYPE,
  parseOpenSpecFocus,
  restoreOpenSpecFocus,
  restoreSessionSubject,
  sameOpenSpecFocus,
  sameTaskFocus,
  sessionSubject,
  taskflowRunFocus,
} from '../src/active-work.ts';
import { collectOpenSpec } from '../src/openspec.ts';
import type { CommandRunner } from '../src/types.ts';

type Handler = (event: any, ctx: ExtensionContext) => unknown;
type Command = {
  handler: (args: string, ctx: ExtensionContext) => unknown;
};
type Tool = {
  parameters: any;
  description?: string;
  execute: (
    toolCallId: string,
    params: any,
    signal: AbortSignal | undefined,
    onUpdate: undefined,
    ctx: ExtensionContext,
  ) => unknown;
};

const change = 'show-active-openspec-in-pi-title';
const taskId = '1.1';
const taskTitle = 'Show active OpenSpec in Pi title';
const activeTitle = `π  ${change} › ${taskId} ${taskTitle}`;
const replacementChange = 'replace-active-openspec-title';
const replacementTaskId = '2.4';
const replacementTaskTitle = 'Replace active title focus';

const originalEnvironment = {
  codingAgentDir: process.env.PI_CODING_AGENT_DIR,
  openspecChange: process.env.PI_OPENSPEC_CHANGE,
};

before(() => {
  process.env.PI_CODING_AGENT_DIR = join(
    tmpdir(),
    `galactica-status-test-agent-${process.pid}`,
  );
  delete process.env.PI_OPENSPEC_CHANGE;
});

after(() => {
  if (originalEnvironment.codingAgentDir === undefined) {
    delete process.env.PI_CODING_AGENT_DIR;
  } else {
    process.env.PI_CODING_AGENT_DIR = originalEnvironment.codingAgentDir;
  }
  if (originalEnvironment.openspecChange === undefined) {
    delete process.env.PI_OPENSPEC_CHANGE;
  } else {
    process.env.PI_OPENSPEC_CHANGE = originalEnvironment.openspecChange;
  }
});

function openSpecResult(
  args: string[],
  focusedTaskTitle = taskTitle,
  focusedTaskDone = false,
) {
  if (args[0] === 'list') {
    return {
      code: 0,
      stdout: JSON.stringify({
        changes: [
          {
            name: change,
            completedTasks: focusedTaskDone ? 1 : 0,
            totalTasks: 1,
            lastModified: '2026-08-01T00:00:00Z',
            status: focusedTaskDone ? 'complete' : 'in-progress',
          },
          {
            name: replacementChange,
            completedTasks: 0,
            totalTasks: 1,
            lastModified: '2026-08-02T00:00:00Z',
            status: 'in-progress',
          },
        ],
        root: { path: '/repos/galactica' },
      }),
      stderr: '',
    };
  }

  const requestedChange = args[0] === 'show' ? args[1] : args[3];
  const fixture =
    requestedChange === replacementChange
      ? {
          taskId: replacementTaskId,
          taskTitle: replacementTaskTitle,
          done: false,
        }
      : { taskId, taskTitle: focusedTaskTitle, done: focusedTaskDone };
  if (args[0] === 'show') {
    return {
      code: 0,
      stdout: JSON.stringify({ title: fixture.taskTitle }),
      stderr: '',
    };
  }
  if (args[0] === 'instructions') {
    return {
      code: 0,
      stdout: JSON.stringify({
        progress: { total: 1, complete: fixture.done ? 1 : 0 },
        tasks: [
          {
            id: fixture.taskId,
            description: `${fixture.taskId} ${fixture.taskTitle} Story`,
            done: fixture.done,
          },
        ],
      }),
      stderr: '',
    };
  }
  return { code: 1, stdout: '', stderr: `unexpected OpenSpec args: ${args}` };
}

type OpenSpecCommandResult = ReturnType<typeof openSpecResult>;
type OpenSpecResponder = (
  args: string[],
) => OpenSpecCommandResult | Promise<OpenSpecCommandResult>;

class RuntimeHarness {
  readonly handlers = new Map<string, Handler[]>();
  readonly commands = new Map<string, Command>();
  readonly tools = new Map<string, Tool>();
  readonly titles: string[] = [];
  readonly appendedCalls: Array<{ customType: string; data: unknown }> = [];
  readonly notifications: Array<{ message: string; level: string | undefined }> = [];
  readonly sharedEvents: Array<{ channel: string; message: unknown }> = [];
  readonly execCalls: Array<{ command: string; args: string[] }> = [];
  readonly entries: any[];
  private branchEntries: any[];
  readonly context: ExtensionContext;
  readonly pi: ExtensionAPI;

  constructor(
    options: {
      cwd?: string;
      sessionName?: string;
      entries?: any[];
      focusedTaskTitle?: string;
      focusedTaskDone?: boolean;
      persisted?: boolean;
      mode?: 'tui' | 'json';
      openSpecResponder?: OpenSpecResponder;
      onTitle?: (title: string) => void;
    } = {},
  ) {
    this.entries = [...(options.entries ?? [])];
    this.branchEntries = this.entries;
    const sharedHandlers = new Map<string, Array<(message: unknown) => void>>();
    let entryOrdinal = this.entries.length;

    this.context = {
      cwd: options.cwd ?? '/work/galactica',
      mode: options.mode ?? 'tui',
      hasUI: (options.mode ?? 'tui') === 'tui',
      ui: {
        notify: (message: string, level?: string) => {
          this.notifications.push({ message, level });
        },
      },
      sessionManager: {
        getBranch: () => [...this.branchEntries],
        getEntries: () => [...this.entries],
        getSessionName: () => options.sessionName,
        getSessionFile: () =>
          options.persisted === false ? undefined : '/sessions/current.jsonl',
        isPersisted: () => options.persisted !== false,
      },
    } as unknown as ExtensionContext;

    this.pi = {
      on: (name: string, handler: Handler) => {
        const handlers = this.handlers.get(name) ?? [];
        handlers.push(handler);
        this.handlers.set(name, handlers);
      },
      registerCommand: (name: string, command: Command) => {
        this.commands.set(name, command);
      },
      registerTool: (tool: Tool & { name: string }) => {
        this.tools.set(tool.name, tool);
      },
      // Pure-renderer contract: production never appends. The mock keeps the
      // API shape and records calls so tests can assert zero appends.
      appendEntry: (customType: string, data: unknown) => {
        this.appendedCalls.push({ customType, data });
        entryOrdinal += 1;
        const entry = {
          type: 'custom',
          id: `entry-${entryOrdinal}`,
          parentId: this.entries.at(-1)?.id ?? null,
          timestamp: new Date(entryOrdinal).toISOString(),
          customType,
          data,
        };
        this.entries.push(entry);
        return entry.id;
      },
      getSessionName: () => options.sessionName,
      exec: async (command: string, args: string[]) => {
        this.execCalls.push({ command, args });
        if (command === 'git') {
          return {
            code: 0,
            stdout: '/repos/galactica\n',
            stderr: '',
          };
        }
        if (command === 'openspec') {
          return options.openSpecResponder
            ? options.openSpecResponder(args)
            : openSpecResult(args, options.focusedTaskTitle, options.focusedTaskDone);
        }
        return { code: 1, stdout: '', stderr: `unexpected command: ${command}` };
      },
      events: {
        on: (channel: string, handler: (message: unknown) => void) => {
          const handlers = sharedHandlers.get(channel) ?? [];
          handlers.push(handler);
          sharedHandlers.set(channel, handlers);
          return () => {
            const current = sharedHandlers.get(channel) ?? [];
            sharedHandlers.set(
              channel,
              current.filter((candidate) => candidate !== handler),
            );
          };
        },
        emit: (channel: string, message: unknown) => {
          this.sharedEvents.push({ channel, message });
          if (
            channel === 'galactica-status:header' &&
            typeof message === 'object' &&
            message !== null &&
            typeof (message as { title?: { subject?: unknown } }).title?.subject ===
              'string'
          ) {
            this.titles.push((message as { title: { subject: string } }).title.subject);
          }
          for (const handler of sharedHandlers.get(channel) ?? []) handler(message);
        },
      },
    } as unknown as ExtensionAPI;

    galacticaStatus(this.pi);
  }

  navigateToBranch(entries: any[]): void {
    this.branchEntries = [...entries];
  }

  async emit(name: string, event: unknown = {}): Promise<unknown> {
    let result: unknown;
    for (const handler of this.handlers.get(name) ?? []) {
      const candidate = await handler(event, this.context);
      if (candidate !== undefined) result = candidate;
    }
    return result;
  }

  async command(name: string, args: string): Promise<void> {
    const command = this.commands.get(name);
    assert.ok(command, `/${name} should be registered`);
    await command.handler(args, this.context);
  }

  async tool(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name);
    assert.ok(tool, `${name} should be registered`);
    return tool.execute('tool-call', params, undefined, undefined, this.context);
  }

  async stop(): Promise<void> {
    await this.emit('session_shutdown', { reason: 'quit' });
  }
}

async function waitFor(
  predicate: () => boolean,
  diagnostics: () => string,
  timeoutMs = 500,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  if (!predicate()) {
    throw new Error(`waitFor timed out after ${timeoutMs}ms: ${diagnostics()}`);
  }
}

function titleDiagnostics(harness: RuntimeHarness): string {
  return `observed titles: ${JSON.stringify(harness.titles)}`;
}

function latestWidgetMessage(harness: RuntimeHarness, id: string): unknown {
  for (let index = harness.sharedEvents.length - 1; index >= 0; index -= 1) {
    const message = harness.sharedEvents[index]?.message;
    if (typeof message !== 'object' || message === null) continue;
    if ('id' in message && message.id === id) return message;
    if (
      'widget' in message &&
      typeof message.widget === 'object' &&
      message.widget !== null &&
      'id' in message.widget &&
      message.widget.id === id
    ) {
      return message;
    }
  }
  return undefined;
}

function latestOpenSpecFooterMessage(harness: RuntimeHarness): unknown {
  return latestWidgetMessage(harness, 'galactica.openspec');
}

function latestOpenSpecProgressMessage(harness: RuntimeHarness): unknown {
  return latestWidgetMessage(harness, 'galactica.openspec-progress');
}

function latestHeader(harness: RuntimeHarness): Record<string, unknown> | undefined {
  for (let index = harness.sharedEvents.length - 1; index >= 0; index -= 1) {
    const event = harness.sharedEvents[index];
    if (event?.channel !== 'galactica-status:header') continue;
    if (typeof event.message !== 'object' || event.message === null) return undefined;
    return event.message as Record<string, unknown>;
  }
  return undefined;
}

function seededFocusEntry(change: string, taskId: string, awaitingValidation = false) {
  return {
    type: 'custom',
    customType: 'galactica-status.openspec-focus.v1',
    data: { mode: 'task', change, taskId, awaitingValidation },
  };
}

function latestHeaderWork(harness: RuntimeHarness):
  | {
      lifecycle?: string;
      titles?: string[];
      color?: string;
      activity?: { kind: string };
      activityPath?: unknown[];
    }
  | null
  | undefined {
  return latestHeader(harness)?.work as
    | {
        lifecycle?: string;
        titles?: string[];
        color?: string;
        activity?: { kind: string };
        activityPath?: unknown[];
      }
    | null
    | undefined;
}

function openSpecFooterText(message: unknown): string | undefined {
  if (
    typeof message !== 'object' ||
    message === null ||
    !('widget' in message) ||
    typeof message.widget !== 'object' ||
    message.widget === null ||
    !('content' in message.widget) ||
    typeof message.widget.content !== 'object' ||
    message.widget.content === null ||
    !('text' in message.widget.content) ||
    typeof message.widget.content.text !== 'string'
  ) {
    return undefined;
  }
  return message.widget.content.text;
}

test('waitFor throws timeout diagnostics instead of silently continuing', async () => {
  await assert.rejects(
    waitFor(
      () => false,
      () => 'expected title was not emitted',
      10,
    ),
    /waitFor timed out after 10ms: expected title was not emitted/u,
  );
});

test('an unfocused OpenSpec repository does not select its newest incomplete change', async () => {
  const calls: string[][] = [];
  const runner: CommandRunner = async (_command, args) => {
    calls.push(args);
    return openSpecResult(args);
  };

  const state = await collectOpenSpec({ cwd: '/repos/galactica', runner });

  assert.equal(state, undefined);
  assert.deepEqual(calls, [['list', '--json']]);
});

test('an unfocused OpenSpec project publishes quiet feedback without warning', async () => {
  const root = await mkdtemp(join(tmpdir(), 'galactica-status-unfocused-'));
  await mkdir(join(root, 'openspec'));
  const harness = new RuntimeHarness({ cwd: root });

  try {
    await harness.emit('session_start', { reason: 'startup' });
    await waitFor(
      () =>
        openSpecFooterText(latestOpenSpecFooterMessage(harness)) ===
        'OpenSpec · no focus',
      () => JSON.stringify(harness.sharedEvents),
    );

    // Focus-gated progress: unfocused aggregate numbers never publish.
    assert.equal(latestOpenSpecProgressMessage(harness), undefined);

    assert.equal(
      harness.notifications.filter(({ level }) => level === 'warning').length,
      0,
    );
    assert.deepEqual(
      harness.execCalls
        .filter(({ command }) => command === 'openspec')
        .map(({ args }) => args),
      [['list', '--json']],
      'feedback must inspect availability without auto-selecting a change',
    );
  } finally {
    await harness.stop();
    await rm(root, { recursive: true, force: true });
  }
});

test('focused metadata selects the exact task and an unknown ID never borrows another headline', async () => {
  const secondTaskId = '1.2';
  const secondTaskTitle = 'Select exact second task';
  const unknownTaskId = '9.9';
  const metadataResult: OpenSpecResponder = async (args) => {
    if (args[0] === 'list') {
      return {
        code: 0,
        stdout: JSON.stringify({
          changes: [
            {
              name: change,
              completedTasks: 0,
              totalTasks: 2,
              lastModified: '2026-08-01T00:00:00Z',
              status: 'in-progress',
            },
          ],
          root: { path: '/repos/galactica' },
        }),
        stderr: '',
      };
    }
    if (args[0] === 'show') {
      return {
        code: 0,
        stdout: JSON.stringify({ title: taskTitle }),
        stderr: '',
      };
    }
    if (args[0] === 'instructions') {
      return {
        code: 0,
        stdout: JSON.stringify({
          progress: { total: 2, complete: 0 },
          tasks: [
            {
              id: taskId,
              description: `${taskId} ${taskTitle} Story`,
              done: false,
            },
            {
              id: secondTaskId,
              description: `${secondTaskId} ${secondTaskTitle} Story`,
              done: false,
            },
          ],
        }),
        stderr: '',
      };
    }
    return { code: 1, stdout: '', stderr: `unexpected OpenSpec args: ${args}` };
  };
  const harness = new RuntimeHarness({
    openSpecResponder: metadataResult,
    entries: [seededFocusEntry(change, secondTaskId)],
  });

  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.command('galactica-status-refresh', '');

    assert.equal(
      harness.titles.at(-1),
      `π  ${change} › ${secondTaskId} ${secondTaskTitle}`,
    );
    assert.equal(
      openSpecFooterText(latestOpenSpecFooterMessage(harness)),
      `0/2  ▶ ${secondTaskId} ${secondTaskTitle}`,
    );
  } finally {
    await harness.stop();
  }

  const unknownHarness = new RuntimeHarness({
    openSpecResponder: metadataResult,
    entries: [seededFocusEntry(change, unknownTaskId)],
  });
  try {
    await unknownHarness.emit('session_start', { reason: 'startup' });
    await unknownHarness.command('galactica-status-refresh', '');

    const unknownTitle = `π  ${change} › ${unknownTaskId}`;
    assert.equal(unknownHarness.titles.at(-1), unknownTitle);
    assert.ok(
      unknownHarness.titles.every((title) => !title.includes(taskTitle)),
      'an unknown task ID must never borrow the first pending task headline',
    );
  } finally {
    await unknownHarness.stop();
  }
});
test('same-focus metadata refresh failure falls back to ID-only title', async () => {
  let rejectOpenSpecRefresh = false;
  const harness = new RuntimeHarness({
    entries: [seededFocusEntry(change, taskId)],
    openSpecResponder: async (args) => {
      if (rejectOpenSpecRefresh && args[0] === 'list') {
        return {
          code: 1,
          stdout: '',
          stderr: 'focused OpenSpec metadata unavailable',
        };
      }
      return openSpecResult(args);
    },
  });

  try {
    await harness.emit('session_start', {
      reason: 'startup',
    });
    await harness.command('galactica-status-refresh', '');

    assert.equal(harness.titles.at(-1), activeTitle);
    const resolvedFooter = latestOpenSpecFooterMessage(harness);
    assert.ok(
      typeof resolvedFooter === 'object' &&
        resolvedFooter !== null &&
        'type' in resolvedFooter &&
        resolvedFooter.type === 'upsert',
      'resolved metadata should publish the focused OpenSpec footer',
    );
    const focusEntry = harness.entries.at(-1);

    rejectOpenSpecRefresh = true;
    await harness.command('galactica-status-refresh', '');

    assert.equal(harness.entries.at(-1), focusEntry);
    assert.deepEqual(focusEntry?.data, {
      mode: 'task',
      change,
      taskId,
      awaitingValidation: false,
    });
    assert.equal(
      harness.titles.at(-1),
      `π  ${change} › ${taskId}`,
      'failed same-focus metadata refresh must discard the stale task headline',
    );
    assert.doesNotMatch(harness.titles.at(-1) ?? '', new RegExp(taskTitle, 'u'));
    const health = harness.sharedEvents
      .filter(({ channel }) => channel === 'pi-stardeck:status-source/v1')
      .at(-1)?.message as
      { source?: string; conditions?: Array<Record<string, unknown>> } | undefined;
    assert.equal(health?.source, 'galactica-status');
    assert.deepEqual(
      health?.conditions?.find(({ id }) => id === 'openspec'),
      {
        id: 'openspec',
        severity: 'warning',
        summary: 'openspec refresh failed; previous status is retained',
      },
    );
  } finally {
    await harness.stop();
  }
});

test('session start emits the session-name fallback before asynchronous refresh', async () => {
  const harness = new RuntimeHarness({ sessionName: 'Review title contract' });
  try {
    const starting = harness.emit('session_start', { reason: 'startup' });
    assert.deepEqual(harness.titles, ['π  Review title contract']);
    await starting;
  } finally {
    await harness.stop();
  }
});

test('PI_OPENSPEC_CHANGE selects collection without establishing session focus', async () => {
  const previousChange = process.env.PI_OPENSPEC_CHANGE;
  process.env.PI_OPENSPEC_CHANGE = change;
  const harness = new RuntimeHarness({ sessionName: 'Environment fallback' });

  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.command('galactica-status-refresh', '');

    assert.ok(
      harness.execCalls.some(
        ({ command, args }) =>
          command === 'openspec' && args[0] === 'show' && args[1] === change,
      ),
      'the environment-selected change should be collected',
    );
    assert.equal(harness.titles.at(-1), 'π  Environment fallback');
    assert.equal(
      harness.sharedEvents.some(({ message }) => {
        if (typeof message !== 'object' || message === null) return false;
        if (!('type' in message) || message.type !== 'upsert') return false;
        return (
          'widget' in message &&
          typeof message.widget === 'object' &&
          message.widget !== null &&
          'id' in message.widget &&
          message.widget.id === 'galactica.openspec'
        );
      }),
      false,
      'an environment-selected change must not upsert a focused OpenSpec footer',
    );
    assert.deepEqual(
      harness.entries,
      [],
      'environment selection must not persist focus',
    );
  } finally {
    await harness.stop();
    if (previousChange === undefined) {
      delete process.env.PI_OPENSPEC_CHANGE;
    } else {
      process.env.PI_OPENSPEC_CHANGE = previousChange;
    }
  }
});

test('session_info_changed immediately propagates an unfocused session rename', async () => {
  const harness = new RuntimeHarness({ sessionName: 'Initial session name' });
  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.emit('session_info_changed', { name: 'Renamed session' });

    assert.equal(harness.titles.at(-1), 'π  Renamed session');
  } finally {
    await harness.stop();
  }
});

test('retired instruments stay retired: work_focus and stage are gone', () => {
  const harness = new RuntimeHarness();
  assert.equal(harness.tools.has('work_focus'), false, 'work_focus is retired');
  assert.equal(harness.tools.has('stage'), false, 'stage is retired');
  assert.equal(harness.commands.has('work'), false, '/work is retired');
  assert.equal(
    harness.tools.has('openspec_focus'),
    false,
    'openspec_focus moved to work-state',
  );
  assert.equal(
    harness.tools.has('title'),
    false,
    'title retired: pi-title owns naming',
  );
  assert.equal(harness.appendedCalls.length, 0, 'pure renderer appends zero entries');
});

test('conversation-driven Taskflow calls publish and clear controlled live activity', async () => {
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.emit('tool_call', {
      toolCallId: 'conversation-taskflow',
      toolName: 'taskflow',
      input: { action: 'run', name: 'enrichment', args: {} },
    });

    const work = latestHeaderWork(harness);
    assert.ok(work, 'work slot present');
    assert.equal(
      JSON.stringify(work?.titles ?? []).includes('Consolidate'),
      false,
      'retired work titles stay retired',
    );
    assert.deepEqual(work?.activity, { kind: 'planning' });

    await harness.emit('tool_execution_end', {
      toolCallId: 'conversation-taskflow',
      toolName: 'taskflow',
      isError: false,
    });
    assert.deepEqual(latestHeaderWork(harness)?.activity, undefined);
  } finally {
    await harness.stop();
  }
});

test('live Taskflow updates preserve focus and add bounded activity ancestry', async () => {
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.emit('tool_call', {
      toolCallId: 'taskflow-live-phase',
      toolName: 'taskflow',
      input: { action: 'run', name: 'ramona-loop', args: {} },
    });
    const seeded = latestHeaderWork(harness);
    assert.equal(
      JSON.stringify(seeded?.titles ?? []).includes('Diagnose'),
      false,
      'retired work titles stay retired',
    );
    assert.deepEqual(seeded?.activityPath, [
      {
        id: 'interpreting-intent',
        label: 'interpreting intent',
        compact: 'interpreting',
      },
    ]);

    await harness.emit('tool_execution_update', {
      toolCallId: 'taskflow-live-phase',
      toolName: 'taskflow',
      args: { action: 'run', name: 'ramona-loop', args: {} },
      partialResult: {
        content: [{ type: 'text', text: 'private live output' }],
        details: {
          action: 'run',
          state: {
            def: {
              phases: [
                { id: 'understanding' },
                { id: 'assuring' },
                { id: 'assuring-private-child' },
              ],
            },
            phases: {
              understanding: { status: 'done' },
              assuring: {
                status: 'running',
                promotedPhases: {
                  'assuring-private-child': { status: 'running' },
                },
              },
              'assuring-private-child': { status: 'running' },
            },
          },
        },
      },
    });

    assert.deepEqual(latestHeaderWork(harness)?.activityPath, [
      { id: 'checking-quality', label: 'checking quality', compact: 'checking' },
    ]);
    assert.doesNotMatch(
      JSON.stringify(latestHeaderWork(harness)),
      /private live output|private-child/u,
    );

    await harness.emit('tool_execution_end', {
      toolCallId: 'taskflow-live-phase',
      toolName: 'taskflow',
      result: { content: [], details: {} },
      isError: false,
    });
  } finally {
    await harness.stop();
  }
});

test('ordinary direct tools publish bounded activity until agent settle', async () => {
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });

    await harness.emit('tool_call', {
      toolCallId: 'direct-read',
      toolName: 'read',
      input: { path: '/private/project/plan.md' },
    });
    assert.deepEqual(latestHeaderWork(harness)?.activity, { kind: 'inspection' });
    assert.equal(latestHeader(harness)?.selection, null);
    assert.equal(latestHeader(harness)?.suggestion, null);

    await harness.emit('tool_execution_end', {
      toolCallId: 'direct-read',
      toolName: 'read',
      isError: false,
    });
    assert.deepEqual(latestHeaderWork(harness)?.activity, { kind: 'synthesis' });

    await harness.emit('tool_call', {
      toolCallId: 'direct-write',
      toolName: 'write',
      input: { path: '/private/project/result.md', content: 'private prose' },
    });
    assert.deepEqual(latestHeaderWork(harness)?.activity, { kind: 'mutation' });

    await harness.emit('tool_execution_end', {
      toolCallId: 'direct-write',
      toolName: 'write',
      isError: false,
    });
    assert.deepEqual(latestHeaderWork(harness)?.activity, { kind: 'change-review' });

    await harness.emit('tool_call', {
      toolCallId: 'direct-verify',
      toolName: 'bash',
      input: { command: 'openspec validate private-change --strict' },
    });
    assert.deepEqual(latestHeaderWork(harness)?.activity, { kind: 'verification' });

    await harness.emit('tool_execution_end', {
      toolCallId: 'direct-verify',
      toolName: 'bash',
      isError: false,
    });
    assert.deepEqual(latestHeaderWork(harness)?.activity, { kind: 'result-review' });
    assert.equal(latestHeader(harness)?.suggestion, null);
    assert.doesNotMatch(
      JSON.stringify(latestHeaderWork(harness)),
      /private|\/project|result\.md/u,
    );

    await harness.emit('agent_settled', {});
    assert.equal(latestHeader(harness)?.suggestion, null);
  } finally {
    await harness.stop();
  }
});

test('parallel direct tools stay active until completion and surface bounded recovery', async () => {
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.emit('tool_call', {
      toolCallId: 'parallel-read-one',
      toolName: 'read',
      input: { path: '/private/one.md' },
    });
    await harness.emit('tool_call', {
      toolCallId: 'parallel-read-two',
      toolName: 'read',
      input: { path: '/private/two.md' },
    });

    await harness.emit('tool_execution_end', {
      toolCallId: 'parallel-read-one',
      toolName: 'read',
      isError: false,
    });
    assert.deepEqual(latestHeaderWork(harness)?.activity, { kind: 'inspection' });

    await harness.emit('tool_execution_end', {
      toolCallId: 'parallel-read-two',
      toolName: 'read',
      isError: true,
    });
    assert.deepEqual(latestHeaderWork(harness)?.activity, { kind: 'recovery' });
    assert.doesNotMatch(JSON.stringify(latestHeaderWork(harness)), /private|\.md/u);
  } finally {
    await harness.stop();
  }
});

test('publishes only lifecycle-evidenced active child runs and subagents', async () => {
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });
    const initialTitleCount = harness.titles.length;

    await harness.emit('tool_execution_start', {
      toolCallId: 'bash-active',
      toolName: 'bash',
      args: { command: 'private command' },
    });
    assert.deepEqual(latestHeader(harness)?.counters, {
      agents: { active: 0, total: 0 },
      activeRuns: { children: 1, subagents: 0 },
    });

    await harness.emit('tool_execution_start', {
      toolCallId: 'subagent-active',
      toolName: 'subagent',
      args: { calls: [{ agent: 'private-agent', prompt: 'private prompt' }] },
    });
    assert.deepEqual(latestHeader(harness)?.counters, {
      agents: { active: 0, total: 0 },
      activeRuns: { children: 1, subagents: 0 },
    });

    await harness.emit('tool_execution_update', {
      toolCallId: 'subagent-active',
      toolName: 'subagent',
      args: { calls: [] },
      partialResult: {
        content: [{ type: 'text', text: 'private child output' }],
        details: {
          kind: 'pi-subagent',
          results: [
            { exitCode: -1, agent: 'queued-agent', prompt: 'queued prompt' },
            {
              exitCode: -1,
              sawAgentStart: true,
              sawAgentSettled: false,
              agent: 'active-agent',
              prompt: 'active prompt',
            },
            {
              exitCode: -1,
              sawAgentStart: true,
              agent: 'second-active-agent',
              prompt: 'second active prompt',
            },
            {
              exitCode: 0,
              sawAgentStart: true,
              sawAgentSettled: true,
              agent: 'complete-agent',
              prompt: 'complete prompt',
            },
          ],
        },
      },
    });
    assert.deepEqual(latestHeader(harness)?.counters, {
      agents: { active: 0, total: 0 },
      activeRuns: { children: 3, subagents: 2 },
    });
    assert.doesNotMatch(
      JSON.stringify(latestHeader(harness)?.counters),
      /private|prompt|output|queued-agent|active-agent|complete-agent/u,
    );

    await harness.emit('tool_execution_end', {
      toolCallId: 'subagent-active',
      toolName: 'subagent',
      isError: false,
    });
    await harness.emit('tool_execution_end', {
      toolCallId: 'bash-active',
      toolName: 'bash',
      isError: false,
    });
    assert.deepEqual(latestHeader(harness)?.counters, {
      agents: { active: 0, total: 0 },
      activeRuns: { children: 0, subagents: 0 },
    });
    assert.equal(
      harness.titles.at(-1),
      harness.titles[initialTitleCount - 1],
      'non-evidenced runs change no band state',
    );
  } finally {
    await harness.stop();
  }
});

test('unfocused direct tools publish an activity-only header bridge', async () => {
  const harness = new RuntimeHarness();
  const latestHeader = () =>
    [...harness.sharedEvents]
      .reverse()
      .find((event) => event.channel === 'galactica-status:header')?.message as
      { activity?: unknown; work?: unknown } | undefined;
  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.emit('tool_call', {
      toolCallId: 'unfocused-read',
      toolName: 'read',
      input: { path: '/private/project/README.md' },
    });

    assert.deepEqual(latestHeader()?.work, {
      lifecycle: 'understanding',
      titles: [], // frozen contract: no narration
      color: 'accent',
      activity: { kind: 'inspection' },
    });
    assert.deepEqual(latestHeader()?.activity, { kind: 'inspection' });
    assert.doesNotMatch(JSON.stringify(latestHeader()), /private|project|README/u);

    await harness.emit('agent_settled', {});
    const settledWork = latestHeader()?.work as
      { lifecycle?: string } | null | undefined;
    assert.equal(settledWork?.lifecycle, 'listening');
    assert.equal(latestHeader()?.activity, null);
  } finally {
    await harness.stop();
  }
});

test('rich lifecycle reports understanding, answering, abort, and next-turn reset', async () => {
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });
    await harness.emit('before_agent_start', {
      prompt: 'Private Human wording must not become focus',
      systemPrompt: 'Base prompt',
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'understanding',
      titles: [], // frozen contract: no narration
      color: 'accent',
      activity: { kind: 'understanding' },
    });

    await harness.emit('message_update', {
      message: {
        role: 'assistant',
        content: [{ type: 'text', text: 'Bounded answer' }],
      },
      assistantMessageEvent: { type: 'text_delta', delta: 'Bounded answer' },
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'answering',
      titles: [], // frozen contract: no narration
      color: 'accent',
      // answering-activity-kind: the phase speaks as an activity so the
      // deck band never claims `awaiting Human` mid-turn.
      activity: { kind: 'answering' },
    });

    const aborted = {
      role: 'assistant',
      content: [],
      stopReason: 'aborted',
    };
    await harness.emit('turn_end', {
      turnIndex: 0,
      message: aborted,
      toolResults: [],
    });
    await harness.emit('agent_settled', {});
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'aborted',
      titles: [], // frozen contract: no narration
      color: 'accent',
      activity: { kind: 'operation-aborted' },
    });

    await harness.emit('before_agent_start', {
      prompt: 'Next private request',
      systemPrompt: 'Base prompt',
    });
    assert.deepEqual(latestHeaderWork(harness), {
      lifecycle: 'understanding',
      titles: [], // frozen contract: no narration
      color: 'accent',
      activity: { kind: 'understanding' },
    });
    assert.doesNotMatch(
      JSON.stringify(latestHeaderWork(harness)),
      /Private Human|Next private/u,
    );
  } finally {
    await harness.stop();
  }
});

test('status package leaves generic routing to native Ramona policy', async () => {
  const parent = new RuntimeHarness();
  try {
    await parent.emit('session_start', { reason: 'startup' });
    const guided = await parent.emit('before_agent_start', {
      prompt: 'Research workflow routing',
      systemPrompt: 'Base prompt',
    });
    assert.equal(guided, undefined);
    assert.equal(
      await parent.emit('tool_call', {
        toolCallId: 'parent-read',
        toolName: 'read',
        input: { path: 'README.md' },
      }),
      undefined,
    );
  } finally {
    await parent.stop();
  }
});

test('generic outer and legacy none placeholders create no status focus side effect', async () => {
  const harness = new RuntimeHarness();
  try {
    await harness.emit('session_start', { reason: 'startup' });
    for (const input of [
      {
        action: 'run',
        name: 'enrichment',
        args: { request: 'Research workflow routing' },
      },
      {
        action: 'run',
        name: 'enrichment',
        args: { change: 'none', task: 'none' },
      },
    ]) {
      assert.equal(
        await harness.emit('tool_call', {
          toolCallId: 'generic-work-loop',
          toolName: 'taskflow',
          input,
        }),
        undefined,
      );
    }
    assert.deepEqual(harness.entries, []);
    assert.equal(
      taskflowRunFocus({ action: 'run', args: { change: 'none', task: 'none' } }),
      undefined,
    );
  } finally {
    await harness.stop();
  }
});

test('session subject normalization rejects empty titles and bounds hostile metadata', () => {
  assert.equal(sessionSubject('set', '   '), undefined);
  assert.equal(sessionSubject('unknown', 'title'), undefined);
  assert.equal(sessionSubject('clear'), NO_SESSION_SUBJECT);
  const subject = sessionSubject(
    'set',
    `  Subject\n\u0007 ${'🧪'.repeat(500)} FORBIDDEN-SUFFIX  `,
  );
  assert.equal(subject?.state, 'set');
  if (subject?.state !== 'set') assert.fail('expected set subject');
  assert.doesNotMatch(subject.title, /[\u0000-\u001f\u007f]/u);
  assert.equal(Array.from(subject.title).length, 120);
  assert.ok(subject.title.endsWith('…'));
  assert.doesNotMatch(subject.title, /FORBIDDEN-SUFFIX/u);
});

test('restoreSessionSubject prefers the latest valid subject entry', () => {
  const entries = [
    {
      type: 'custom',
      customType: 'galactica-status.session-subject.v1',
      data: { state: 'set', title: 'First subject' },
    },
    {
      type: 'custom',
      customType: 'galactica-status.unrelated.v1',
      data: { state: 'active', intent: 'Work' },
    },
    {
      type: 'custom',
      customType: 'galactica-status.session-subject.v1',
      data: { state: 'set', title: 'Latest subject' },
    },
    {
      type: 'custom',
      customType: 'galactica-status.session-subject.v1',
      data: { state: 'invalid' },
    },
  ];
  assert.deepEqual(restoreSessionSubject(entries), {
    state: 'set',
    title: 'Latest subject',
  });
  assert.deepEqual(restoreSessionSubject([]), NO_SESSION_SUBJECT);
});

test('subject titles fill the fallback beneath the native session name', () => {
  const common = {
    focus: { mode: 'none' } as const,
    projectRoot: '/repos/repository-choice',
    cwd: '/work/cwd-choice',
  };
  const subject = { state: 'set', title: 'Session subject' } as const;

  assert.equal(formatActiveWorkTitle({ ...common, subject }), `π  Session subject`);
  assert.equal(
    formatActiveWorkTitle({ ...common, sessionName: 'Native name', subject }),
    `π  Native name`,
  );
  assert.equal(
    formatActiveWorkTitle({
      ...common,
      subject,
      focus: { mode: 'task', change, taskId, awaitingValidation: false },
    }),
    `π  ${change} › ${taskId}`,
  );
});

test('openspec focus validation flag round-trips and degrades for legacy entries', () => {
  const legacy = parseOpenSpecFocus({ mode: 'task', change, taskId });
  assert.ok(legacy);
  assert.deepEqual(legacy, { mode: 'task', change, taskId, awaitingValidation: false });

  const validated = parseOpenSpecFocus({
    mode: 'task',
    change,
    taskId,
    awaitingValidation: true,
  });
  assert.ok(validated?.mode === 'task');
  assert.equal(validated.awaitingValidation, true);
  assert.equal(sameOpenSpecFocus(legacy, validated), false);
  assert.equal(sameTaskFocus(legacy, validated), true);

  const restored = restoreOpenSpecFocus([
    { type: 'custom', customType: OPEN_SPEC_FOCUS_ENTRY_TYPE, data: { mode: 'none' } },
    {
      type: 'custom',
      customType: OPEN_SPEC_FOCUS_ENTRY_TYPE,
      data: { mode: 'task', change, taskId, awaitingValidation: true },
    },
  ]);
  assert.deepEqual(restored, {
    mode: 'task',
    change,
    taskId,
    awaitingValidation: true,
  });
});

test('deliver-change Taskflow focus requires run with string nested change and task values', async (t) => {
  const cases = [
    {
      name: 'status action with nested values',
      input: {
        name: 'deliver-change',
        action: 'status',
        args: { change, task: taskId },
      },
    },
    {
      name: 'resume action with nested values',
      input: {
        name: 'deliver-change',
        action: 'resume',
        args: { change, task: taskId },
      },
    },
    {
      name: 'missing nested change',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { task: taskId },
      },
    },
    {
      name: 'missing nested task',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { change },
      },
    },
    {
      name: 'non-string nested change',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { change: 42, task: taskId },
      },
    },
    {
      name: 'non-string nested task',
      input: {
        name: 'deliver-change',
        action: 'run',
        args: { change, task: 42 },
      },
    },
    {
      name: 'top-level change and task',
      input: {
        name: 'deliver-change',
        action: 'run',
        change,
        task: taskId,
      },
    },
  ] as const;

  for (const scenario of cases) {
    await t.test(scenario.name, async () => {
      const harness = new RuntimeHarness({ sessionName: 'No Taskflow focus' });
      try {
        await harness.emit('session_start', { reason: 'startup' });
        const result = await harness.emit('tool_call', {
          toolCallId: `taskflow-negative-${scenario.name}`,
          toolName: 'taskflow',
          input: scenario.input,
        });

        assert.equal(result, undefined);
        assert.deepEqual(harness.entries, []);
        assert.equal(harness.titles.at(-1), 'π  No Taskflow focus');
      } finally {
        await harness.stop();
      }
    });
  }
});

test('reload restores IDs before progressing to the metadata-resolved title', async () => {
  const first = new RuntimeHarness({
    entries: [seededFocusEntry(change, taskId)],
  });
  try {
    await first.emit('session_start', { reason: 'startup' });
    assert.equal(first.entries.at(-1)?.data?.mode, 'task');
  } finally {
    await first.stop();
  }

  const reloaded = new RuntimeHarness({ entries: first.entries });
  try {
    const starting = reloaded.emit('session_start', { reason: 'reload' });
    assert.equal(
      reloaded.titles[0],
      `π  ${change} › ${taskId}`,
      'restored explicit IDs should be visible without waiting for task metadata',
    );
    await starting;
    await waitFor(
      () => reloaded.titles.includes(activeTitle),
      () => titleDiagnostics(reloaded),
    );
    assert.equal(reloaded.titles.at(-1), activeTitle);
  } finally {
    await reloaded.stop();
  }
});

test('tree navigation restores the selected branch focus', async () => {
  const root = {
    type: 'message',
    id: 'root',
    parentId: null,
    timestamp: new Date(1).toISOString(),
    message: { role: 'user', content: 'Choose work' },
  };
  const focused = {
    type: 'custom',
    id: 'focused',
    parentId: root.id,
    timestamp: new Date(2).toISOString(),
    customType: 'galactica-status.openspec-focus.v1',
    data: { mode: 'task', change, taskId },
  };
  const cleared = {
    type: 'custom',
    id: 'cleared',
    parentId: root.id,
    timestamp: new Date(3).toISOString(),
    customType: 'galactica-status.openspec-focus.v1',
    data: { mode: 'none' },
  };
  const harness = new RuntimeHarness({
    sessionName: 'Branch fallback',
    entries: [root, focused, cleared],
  });
  try {
    harness.navigateToBranch([root, focused]);
    await harness.emit('session_start', { reason: 'resume' });
    assert.equal(harness.titles[0], `π  ${change} › ${taskId}`);

    harness.navigateToBranch([root, cleared]);
    await harness.emit('session_tree', {
      oldLeafId: focused.id,
      newLeafId: cleared.id,
    });

    assert.equal(harness.titles.at(-1), 'π  Branch fallback');
  } finally {
    await harness.stop();
  }
});

test('fallback titles use distinguishable session, repository, then cwd precedence', () => {
  const common = {
    focus: { mode: 'none' } as const,
    projectRoot: '/repos/repository-choice',
    cwd: '/work/cwd-choice',
  };

  assert.equal(
    formatActiveWorkTitle({ ...common, sessionName: 'session choice' }),
    'π  session choice',
  );
  assert.equal(formatActiveWorkTitle(common), 'π  repository-choice');
  assert.equal(
    formatActiveWorkTitle({ focus: common.focus, cwd: common.cwd }),
    'π  cwd-choice',
  );
});

test('Task focus, native session name, and subject fallback precedence stays explicit', () => {
  const common = {
    sessionName: 'Native session name',
    subject: { state: 'set', title: 'Session subject' } as const,
    cwd: '/work/cwd-choice',
  };

  assert.equal(
    formatActiveWorkTitle({ focus: { mode: 'none' }, ...common }),
    `π  Native session name`,
  );
  assert.equal(
    formatActiveWorkTitle({
      focus: { mode: 'none' },
      ...common,
      sessionName: undefined,
    }),
    `π  Session subject`,
  );
  assert.equal(
    formatActiveWorkTitle({
      focus: { mode: 'task', change, taskId, awaitingValidation: false },
      ...common,
    }),
    `π  ${change} › ${taskId}`,
  );
});

test('fallback titles normalize hostile session text and remain bounded', async () => {
  const longName = `  Review\n\u0007 title ${'x'.repeat(5_000)}  `;
  const harness = new RuntimeHarness({ sessionName: longName });
  try {
    await harness.emit('session_start', { reason: 'startup' });
    const title = harness.titles[0] ?? '';

    assert.match(title, /^π  Review title /u);
    assert.doesNotMatch(title, /[\u0000-\u001f\u007f]/u);
    assert.ok(Array.from(title).length <= 180);
    assert.ok(title.length < longName.length);
  } finally {
    await harness.stop();
  }
});

test('focused hostile headlines are sanitized and bounded independently', async () => {
  const hostileHeadline = `\n\u0007${'🧪'.repeat(500)} FORBIDDEN-SUFFIX`;
  const harness = new RuntimeHarness({
    focusedTaskTitle: hostileHeadline,
    entries: [seededFocusEntry(change, taskId)],
  });
  try {
    await harness.emit('session_start', { reason: 'startup' });
    await waitFor(
      () => harness.titles.at(-1)?.includes('🧪') === true,
      () => titleDiagnostics(harness),
    );

    const title = harness.titles.at(-1) ?? '';
    const prefix = `π  ${change} › ${taskId} `;
    const headline = title.slice(prefix.length);
    assert.ok(title.startsWith(prefix));
    assert.doesNotMatch(title, /[\u0000-\u001f\u007f]/u);
    assert.equal(Array.from(headline).length, 72);
    assert.ok(headline.endsWith('…'));
    assert.doesNotMatch(title, /FORBIDDEN-SUFFIX/u);
    assert.ok(Array.from(title).length <= 180);
  } finally {
    await harness.stop();
  }
});

test('the overall title bound is exactly 180 Unicode code points', () => {
  const title = formatActiveWorkTitle({
    focus: {
      mode: 'task',
      change: '🛰'.repeat(500),
      taskId,
      awaitingValidation: false,
    },
    cwd: '/work/cwd-choice',
  });

  assert.equal(Array.from(title).length, 180);
  assert.ok(title.endsWith('…'));
  assert.ok(title.length > 180, 'the bound must count code points, not UTF-16 units');
});
