import assert from 'node:assert/strict';
import test from 'node:test';

import galacticaContextHeader, { installEmptyDeckFooter } from '../index.ts';

test('deck mode captures native statuses through an otherwise empty footer', () => {
  const footerFactories: unknown[] = [];
  const snapshots: Array<Array<{ key: string; text: string }>> = [];
  const availability: boolean[] = [];
  let statusApiAvailable = true;
  const ctx = {
    ui: {
      setFooter(factory: unknown) {
        footerFactories.push(factory);
      },
    },
  };

  const cleanup = installEmptyDeckFooter(
    ctx as never,
    (statuses) => {
      snapshots.push(statuses);
    },
    (available) => {
      availability.push(available);
    },
  );
  const factory = footerFactories[0];
  const statuses = new Map([
    ['ssh', '\u001b[32mconnected\u001b[0m'],
    ['empty', ''],
  ]);

  assert.equal(typeof factory, 'function');
  const component = (
    factory as (
      tui: unknown,
      theme: unknown,
      footerData: { getExtensionStatuses(): ReadonlyMap<string, string> },
    ) => {
      render(width: number): string[];
      invalidate(): void;
    }
  )(
    {},
    {},
    {
      getExtensionStatuses: () => {
        if (!statusApiAvailable) throw new Error('unavailable');
        return statuses;
      },
    },
  );
  assert.deepEqual(component.render(120), []);
  assert.deepEqual(component.render(120), []);
  statusApiAvailable = false;
  assert.deepEqual(component.render(120), []);
  statusApiAvailable = true;
  assert.deepEqual(component.render(120), []);
  assert.deepEqual(snapshots, [
    [{ key: 'ssh', text: '\u001b[32mconnected\u001b[0m' }],
    [],
    [{ key: 'ssh', text: '\u001b[32mconnected\u001b[0m' }],
  ]);
  assert.deepEqual(availability, [true, false, true]);
  assert.doesNotThrow(() => component.invalidate());

  cleanup();
  assert.equal(footerFactories.at(-1), undefined);
});

test('editor-deck publishes a renderer without registering an above-editor widget', async () => {
  const handlers = new Map<string, Array<(event: unknown, ctx?: unknown) => void>>();
  const sharedHandlers = new Map<string, Array<(message: unknown) => void>>();
  const emitted: Array<{ channel: string; message: unknown }> = [];
  const renderers: Array<((width: number, theme: unknown) => string[]) | null> = [];
  const deckSurface = {
    setRenderer(renderer: ((width: number, theme: unknown) => string[]) | null) {
      renderers.push(renderer);
    },
    requestRender() {},
  };
  const pi = {
    events: {
      on(channel: string, handler: (message: unknown) => void) {
        const current = sharedHandlers.get(channel) ?? [];
        current.push(handler);
        sharedHandlers.set(channel, current);
        return () => {};
      },
      emit(channel: string, message: unknown) {
        emitted.push({ channel, message });
        for (const handler of sharedHandlers.get(channel) ?? []) handler(message);
      },
    },
    on(name: string, handler: (event: unknown, ctx?: unknown) => void) {
      const current = handlers.get(name) ?? [];
      current.push(handler);
      handlers.set(name, current);
    },
    exec: async () => ({ code: 1, stdout: '', stderr: '' }),
    getThinkingLevel: () => 'high',
  };
  const footerFactories: unknown[] = [];
  const ctx = {
    mode: 'tui',
    hasUI: true,
    cwd: '/tmp/project',
    model: { name: 'Test Model', contextWindow: 100_000 },
    getContextUsage: () => ({ percent: 25, tokens: 25_000 }),
    sessionManager: {
      getBranch: () => [],
      getSessionId: () => '01a157fd-382e-72a8-ba81-26a10cf103ef',
    },
    ui: {
      setWorkingVisible() {},
      setFooter(factory: unknown) {
        footerFactories.push(factory);
      },
      setWidget() {
        assert.fail('editor-deck must not register an above-editor widget');
      },
    },
  };

  galacticaContextHeader(pi as never, {
    surface: 'editor-deck',
    deckSurface: deckSurface as never,
  });
  handlers.get('session_start')?.[0]?.({}, ctx);

  try {
    const renderer = renderers.at(-1);
    assert.equal(typeof renderer, 'function');
    const theme = {
      fg: (_color: string, text: string) => text,
      bold: (text: string) => text,
    };
    const lines = renderer?.(120, theme) ?? [];
    // The ladybug sentinel retired with the session id (reorder-deck-frame
    // 2026-11-11): no reserved glyph anywhere — the frame only speaks when
    // it has something to say.
    assert.equal(
      lines.some((line) => line.includes('󰠭')),
      false,
    );
    assert.equal(
      // Gray-out amendment: dim numeric zeros replace every placeholder dash.
      lines.some((line) => line.includes('—')),
      false,
    );
    assert.ok(lines.length > 0);
    assert.equal(typeof footerFactories[0], 'function');

    for (const handler of sharedHandlers.get('pi-mcp-adapter/status/v1') ?? []) {
      handler({
        version: 1,
        servers: [
          { status: 'connected', disabled: false, toolCount: 3 },
          { status: 'failed', disabled: false, toolCount: 0 },
        ],
      });
    }
    const degradedCapabilities = emitted
      .filter(({ channel }) => channel === 'pi-stardeck:status-source/v1')
      .at(-1)?.message as
      { source?: string; conditions?: Array<Record<string, unknown>> } | undefined;
    assert.equal(degradedCapabilities?.source, 'galactica-context-header');
    assert.deepEqual(degradedCapabilities?.conditions, [
      {
        id: 'mcp',
        severity: 'warning',
        summary: '1 MCP servers need attention',
      },
    ]);

    for (const handler of sharedHandlers.get('pi-mcp-adapter/status/v1') ?? []) {
      handler({
        version: 1,
        servers: [{ status: 'connected', disabled: false, toolCount: 3 }],
      });
    }
    const recoveredCapabilities = emitted
      .filter(({ channel }) => channel === 'pi-stardeck:status-source/v1')
      .at(-1)?.message as { conditions?: unknown[] } | undefined;
    assert.deepEqual(recoveredCapabilities?.conditions, []);

    const emptyFooter = (
      footerFactories[0] as (
        tui: unknown,
        theme: unknown,
        footerData: unknown,
      ) => { render(width: number): string[] }
    )({}, {}, {});
    assert.deepEqual(emptyFooter.render(120), []);
    const unavailableNativeStatuses = emitted
      .filter(({ channel }) => channel === 'pi-stardeck:status-source/v1')
      .at(-1)?.message as { conditions?: unknown[] } | undefined;
    assert.deepEqual(unavailableNativeStatuses?.conditions, [
      {
        id: 'native-status-api',
        severity: 'warning',
        summary: 'Pi native extension statuses are unavailable',
      },
    ]);
  } finally {
    // A skipped shutdown leaks the activity ticker and hangs the runner —
    // the frame's cleanup may never be conditional on assertions.
    handlers.get('session_shutdown')?.[0]?.({});
  }
  assert.equal(renderers.at(-1), null);
  assert.equal(footerFactories.at(-1), undefined);
  await new Promise((resolve) => setImmediate(resolve));
});

test('deck mode registers the deck above and the warning below the editor', async () => {
  const handlers = new Map<string, Array<(event: unknown, ctx?: unknown) => void>>();
  const sharedHandlers = new Map<string, Array<(message: unknown) => void>>();
  const widgets: Array<{
    key: string;
    placement?: string;
    factory:
      | ((
          tui: unknown,
          theme: unknown,
        ) => { render(width: number): string[]; invalidate(): void })
      | undefined;
  }> = [];
  const pi = {
    events: {
      on(channel: string, handler: (message: unknown) => void) {
        const current = sharedHandlers.get(channel) ?? [];
        current.push(handler);
        sharedHandlers.set(channel, current);
        return () => {};
      },
      emit(channel: string, message: unknown) {
        for (const handler of sharedHandlers.get(channel) ?? []) handler(message);
      },
    },
    on(name: string, handler: (event: unknown, ctx?: unknown) => void) {
      const current = handlers.get(name) ?? [];
      current.push(handler);
      handlers.set(name, current);
    },
    exec: async () => ({ code: 1, stdout: '', stderr: '' }),
    getThinkingLevel: () => 'high',
  };
  const ctx = {
    mode: 'tui',
    hasUI: true,
    cwd: '/tmp/project',
    model: { name: 'Test Model', contextWindow: 100_000 },
    getContextUsage: () => ({ percent: 25, tokens: 25_000 }),
    sessionManager: {
      getBranch: () => [],
      getSessionId: () => '01a157fd-382e-72a8-ba81-26a10cf103ef',
    },
    ui: {
      setWorkingVisible() {},
      setFooter() {},
      setWidget(
        key: string,
        factory:
          | ((
              tui: unknown,
              theme: unknown,
            ) => { render(width: number): string[]; invalidate(): void })
          | undefined,
        options?: { placement?: string },
      ) {
        widgets.push({ key, placement: options?.placement, factory });
      },
    },
  };

  galacticaContextHeader(pi as never);
  handlers.get('session_start')?.[0]?.({}, ctx);

  try {
    // move-warning-below-prompt (2026-11-11): the deck rides above the
    // editor; the aggregated warning speaks below the prompt.
    assert.deepEqual(
      widgets.map(({ key, placement }) => ({ key, placement })),
      [
        { key: 'galactica.work-identity', placement: 'aboveEditor' },
        { key: 'galactica.deck-warning', placement: 'belowEditor' },
      ],
    );

    const theme = {
      fg: (_color: string, text: string) => text,
      bold: (text: string) => text,
    };
    const tui = { requestRender() {} };
    const deckComponent = widgets[0]?.factory?.(tui, theme);
    const warningComponent = widgets[1]?.factory?.(tui, theme);
    assert.equal(typeof deckComponent?.render, 'function');
    assert.equal(typeof warningComponent?.render, 'function');

    // Clean room: the deck speaks, the warning stays silent.
    const cleanDeck = deckComponent?.render(120) ?? [];
    assert.ok(cleanDeck.length > 0);
    assert.deepEqual(warningComponent?.render(120), []);

    // A published status snapshot moves the 🔔 below the prompt and
    // keeps the deck clean.
    for (const handler of sharedHandlers.get('pi-stardeck:pi-status/v1') ?? []) {
      handler({
        protocol: 1,
        type: 'snapshot',
        errors: 0,
        warnings: 0,
        nativeStatusCount: 1,
        nativeStatuses: [{ key: 'appa', text: 'appa unreachable' }],
      });
    }
    assert.deepEqual(
      (warningComponent?.render(120) ?? []).map((line) =>
        line.replace(/\u001b\[[0-9;]*m/g, ''),
      ),
      ['🔔 appa unreachable'],
    );
    assert.equal(
      (deckComponent?.render(120) ?? [])
        .map((line) => line.replace(/\u001b\[[0-9;]*m/g, ''))
        .join('\n')
        .includes('🔔'),
      false,
      'the deck never carries the warning',
    );
  } finally {
    // A skipped shutdown leaks the activity ticker and hangs the runner —
    // the frame's cleanup may never be conditional on assertions.
    handlers.get('session_shutdown')?.[0]?.({});
  }

  // Session re-entry clears both widgets before re-registering them.
  handlers.get('session_start')?.[0]?.({}, ctx);
  assert.deepEqual(
    widgets.slice(-4, -2).map(({ key, factory }) => ({ key, factory })),
    [
      { key: 'galactica.work-identity', factory: undefined },
      { key: 'galactica.deck-warning', factory: undefined },
    ],
  );
  assert.deepEqual(
    widgets.slice(-2).map(({ key, placement }) => ({ key, placement })),
    [
      { key: 'galactica.work-identity', placement: 'aboveEditor' },
      { key: 'galactica.deck-warning', placement: 'belowEditor' },
    ],
  );
  // The re-entry above armed fresh timers — close the session again so
  // the runner never waits on a leaked interval.
  handlers.get('session_shutdown')?.[0]?.({});
  await new Promise((resolve) => setImmediate(resolve));
});
