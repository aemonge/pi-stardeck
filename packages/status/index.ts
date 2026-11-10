import type {
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
} from '@earendil-works/pi-coding-agent';
import { promises as fs, watch } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  formatActiveWorkTitle,
  type OpenSpecFocus,
  parseOpenSpecFocus,
  restoreOpenSpecFocus,
  restoreSessionSubject,
  sameOpenSpecFocus,
  sameSessionSubject,
  type SessionSubject,
} from './src/active-work.ts';
import { collectDiagnostics } from './src/diagnostics.ts';
import { loadConfig } from './src/config.ts';
import { resolveGateAct } from './src/gate-act.ts';
import { collectOpenSpec, collectOpenSpecOverview } from './src/openspec.ts';
import { collectOrchestration } from './src/orchestration.ts';
import {
  buildHeaderStatusEvent,
  buildWidgetSnapshots,
  FancyFooterPublisher,
  FANCY_FOOTER_READY_CHANNEL,
  FANCY_FOOTER_WIDGET_CHANNEL,
  formatDiagnostics,
  formatOpenSpec,
  formatOpenSpecOverview,
  formatOrchestration,
  GALACTICA_HEADER_CHANNEL,
  type HeaderActivity,
  type HeaderLifecycle,
  directToolCompletionHeaderActivity,
  directToolHeaderActivity,
  headerLifecycleForActivity,
  taskflowCallHeaderActivity,
  taskflowInitialHeaderPhase,
  taskflowPhaseHeaderLifecycle,
  taskflowUpdateHeaderPhase,
} from './src/publisher.ts';
import { RuntimeSpanStore } from './src/runtime-runs.ts';
import { TitleActivityFeed } from './src/title-activity.ts';
import {
  buildTitleState,
  titleStateDebugLine,
  type TitleState,
} from './src/title-state.ts';
import { TurnCostMeter } from './src/turn-cost.ts';
import {
  AtomicStatusStore,
  createDebouncer,
  ResourceBag,
  type RefreshOutcome,
} from './src/state.ts';
import { boundedPhase, EventLedger, type LedgerEvent } from './src/ledger.ts';
import {
  applyEvent,
  emptyFacts,
  snapshotFromFacts,
  type ReducerFacts,
} from './src/reducer.ts';
import type {
  CockpitSnapshot,
  CommandRunner,
  DiagnosticsState,
  LoadedConfig,
  OpenSpecFeedback,
  OpenSpecOverview,
  OpenSpecState,
  OrchestrationState,
  RuntimeErrorRecord,
} from './src/types.ts';

type SessionContext = ExtensionContext | ExtensionCommandContext;
type Domain = RuntimeErrorRecord['domain'];

type StatusHealthCondition = {
  id: string;
  severity: 'warning' | 'error';
  summary: string;
};

const PI_STATUS_SOURCE_CHANNEL = 'pi-stardeck:status-source/v1';

function stableStatusId(prefix: string, value: string): string {
  let hash = 2_166_136_261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16_777_619);
  }
  return `${prefix}.${(hash >>> 0).toString(16)}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function assistantStopReason(message: unknown): string | undefined {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return undefined;
  }
  const candidate = message as { role?: unknown; stopReason?: unknown };
  return candidate.role === 'assistant' && typeof candidate.stopReason === 'string'
    ? candidate.stopReason
    : undefined;
}

function assistantHasVisibleText(message: unknown): boolean {
  if (!message || typeof message !== 'object' || Array.isArray(message)) return false;
  const candidate = message as { role?: unknown; content?: unknown };
  if (candidate.role !== 'assistant') return false;
  if (typeof candidate.content === 'string') return candidate.content.length > 0;
  return (
    Array.isArray(candidate.content) &&
    candidate.content.some(
      (item) =>
        item !== null &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        (item as { type?: unknown }).type === 'text' &&
        typeof (item as { text?: unknown }).text === 'string' &&
        (item as { text: string }).text.length > 0,
    )
  );
}

async function pathIsDirectory(path: string): Promise<boolean> {
  try {
    return (await fs.stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function detectProjectRoot(cwd: string, runner: CommandRunner): Promise<string> {
  let candidate = resolve(cwd);
  for (let depth = 0; depth < 8; depth += 1) {
    if (await pathIsDirectory(join(candidate, 'openspec'))) return candidate;
    if (await pathIsDirectory(join(candidate, '.git'))) return candidate;
    const parent = dirname(candidate);
    if (parent === candidate) break;
    candidate = parent;
  }

  try {
    const result = await runner('git', ['rev-parse', '--show-toplevel'], {
      cwd,
      timeoutMs: 2_000,
    });
    const root = result.stdout.trim();
    if (result.code === 0 && root) return root;
  } catch {
    // Non-Git projects use their session cwd.
  }
  return resolve(cwd);
}

class GalacticaStatusRuntime {
  private readonly resources = new ResourceBag();
  private watchCleanups: Array<() => void> = [];
  private watchSignature = '';
  private generation = 0;
  private stopped = false;
  private refreshPromise: Promise<void> | undefined;
  private refreshRequested = false;
  private pendingForceCommand = false;
  private loadedConfig: LoadedConfig | undefined;
  private openSpecFeedback: OpenSpecFeedback | undefined;
  private openSpecOverview: OpenSpecOverview | undefined;
  private openSpecProjectDetected: boolean | undefined;
  private focus: OpenSpecFocus;
  /** Publisher-owned timestamp of the current focus fact — seeded at
   *  construction, refreshed on every accepted focus change; staleness
   *  compares it against the change directory's file truth. */
  private focusAt: number | undefined;
  /** The gate's relayed act line for the focused change — commentary
   *  beside the declared focus, never a replacement; cleared whenever
   *  the focus moves so stale gate truth never survives a switch. */
  private gateAct: { change: string; line?: string } | undefined;
  private subject: SessionSubject;
  private sessionName: string | undefined;
  private diagnosticsPath: string | undefined;
  private orchestrationPath: string | undefined;
  private liveLifecycle: HeaderLifecycle;
  private liveActivity: HeaderActivity | undefined;
  private liveTaskflowPhase: string | undefined;
  private readonly directToolActivities = new Map<string, HeaderActivity>();
  private directToolFailed = false;
  private readonly runtimeSpans = new RuntimeSpanStore();
  private readonly titleActivity = new TitleActivityFeed();
  private readonly turnCost = new TurnCostMeter();
  private currentTurnId: string | null = null;
  private turnCounter = 0;
  private readonly statusHealth = new Map<Domain, StatusHealthCondition>();
  private lastStatusHealthSignature = '';
  private readonly store: AtomicStatusStore;
  private readonly statusLedger = new EventLedger();
  private cockpitFacts: ReducerFacts = emptyFacts();
  private cockpitVersion = 0;
  private readonly pi: ExtensionAPI;
  private readonly ctx: SessionContext;
  private readonly publisher: FancyFooterPublisher;

  constructor(
    pi: ExtensionAPI,
    ctx: SessionContext,
    publisher: FancyFooterPublisher,
    focus: OpenSpecFocus,
    subject: SessionSubject,
    sessionName: string | undefined,
  ) {
    this.pi = pi;
    this.ctx = ctx;
    this.publisher = publisher;
    this.focus = focus;
    this.subject = subject;
    this.sessionName = sessionName;
    this.focusAt = Date.now();
    const restoredAwaitingValidation =
      focus.mode === 'task' && focus.awaitingValidation;
    this.liveLifecycle = restoredAwaitingValidation ? 'waiting' : 'listening';
    this.liveActivity = restoredAwaitingValidation
      ? { kind: 'awaiting-validation' }
      : undefined;
    this.store = new AtomicStatusStore({
      cwd: ctx.cwd,
      projectRoot: ctx.cwd,
      configPath: '',
    });
    const seededAt = Date.now();
    this.recordEvent({ type: 'focus/openspec', at: seededAt, focus });
    this.recordEvent({ type: 'focus/subject', at: seededAt, subject });
  }

  private runner: CommandRunner = async (command, args, options) => {
    const result = await this.pi.exec(command, args, {
      cwd: options.cwd,
      timeout: options.timeoutMs,
    });
    return {
      stdout: String(result.stdout ?? ''),
      stderr: String(result.stderr ?? ''),
      code: result.code,
      killed: result.killed,
    };
  };

  start(): void {
    // Heartbeat: span ages and the idle timer are publish-time facts; without
    // a tick they freeze. One unref'd interval, no-op when nothing is live.
    this.resources.addInterval(() => {
      if (this.stopped) return;
      const snap = this.runtimeSpans.snapshot();
      const idle = this.runtimeSpans.idleMs();
      if ((snap.spans?.length ?? 0) > 0 || idle > 0) this.publish();
    }, 1_000);
    this.publish();
    this.launch(
      (async () => {
        this.loadedConfig = await loadConfig();
        this.statusHealth.delete('config');
        this.store.setConfig(this.loadedConfig.path, this.loadedConfig.warnings);
        for (const warning of this.loadedConfig.warnings) {
          this.store.recordError({
            domain: 'config',
            message: warning,
            at: Date.now(),
          });
        }

        this.resources.addInterval(() => this.publish(), 60_000);
        if (
          this.loadedConfig.config.diagnostics.enabled &&
          this.loadedConfig.config.diagnostics.runAutomatically &&
          this.loadedConfig.config.diagnostics.command
        ) {
          this.resources.addInterval(
            () => this.launch(this.refresh(true), 'diagnostics'),
            this.loadedConfig.config.diagnostics.intervalSeconds * 1_000,
          );
        }
        await this.refresh(false);
      })(),
      'config',
    );
  }

  private launch(promise: Promise<unknown>, domain: Domain): void {
    void promise.catch((error) => {
      if (this.stopped) return;
      this.recordError(domain, errorMessage(error));
      this.publish();
    });
  }

  private recordError(domain: Domain, message: string): void {
    this.store.recordError({ domain, message, at: Date.now() });
    if (domain === 'config') {
      this.statusHealth.set(domain, {
        id: domain,
        severity: 'error',
        summary: 'Galactica status configuration could not be loaded',
      });
    }
  }

  private updateRefreshHealth(
    domain: Extract<Domain, 'openspec' | 'diagnostics' | 'orchestration'>,
    outcomes: readonly RefreshOutcome<unknown>[],
    retained: boolean,
  ): void {
    if (!outcomes.some((outcome) => outcome.kind === 'error')) {
      this.statusHealth.delete(domain);
      return;
    }
    this.statusHealth.set(domain, {
      id: domain,
      severity: retained ? 'warning' : 'error',
      summary: retained
        ? `${domain} refresh failed; previous status is retained`
        : `${domain} status is unavailable`,
    });
  }

  private publishStatusHealth(): void {
    const snapshot = this.store.get();
    const conditions: StatusHealthCondition[] = [
      ...snapshot.configWarnings.map((warning) => ({
        id: stableStatusId('config-warning', warning),
        severity: 'warning' as const,
        summary: 'A Galactica status configuration value was ignored',
      })),
      ...this.statusHealth.values(),
    ].sort((left, right) => left.id.localeCompare(right.id));
    const signature = JSON.stringify(conditions);
    if (signature === this.lastStatusHealthSignature) return;
    this.lastStatusHealthSignature = signature;
    this.pi.events.emit(PI_STATUS_SOURCE_CHANNEL, {
      protocol: 1,
      type: 'snapshot',
      source: 'galactica-status',
      conditions,
    });
  }

  private async outcome<T>(
    domain: Domain,
    collect: () => Promise<T | undefined>,
  ): Promise<RefreshOutcome<T>> {
    try {
      const value = await collect();
      return value === undefined ? { kind: 'absent' } : { kind: 'success', value };
    } catch (error) {
      const message = errorMessage(error);
      this.recordError(domain, message);
      return { kind: 'error', error: message };
    }
  }

  async refresh(forceCommand: boolean): Promise<void> {
    this.pendingForceCommand ||= forceCommand;
    if (this.refreshPromise) {
      this.refreshRequested = true;
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      do {
        const runCommand = this.pendingForceCommand;
        this.pendingForceCommand = false;
        this.refreshRequested = false;
        await this.refreshOnce(runCommand);
      } while (!this.stopped && (this.pendingForceCommand || this.refreshRequested));
    })().finally(() => {
      this.refreshPromise = undefined;
    });
    return this.refreshPromise;
  }

  private async refreshOnce(runCommand: boolean): Promise<void> {
    const generation = ++this.generation;
    if (!this.loadedConfig || this.stopped) return;
    const config = this.loadedConfig.config;
    const focus = this.focus;
    const at = Date.now();
    let projectRoot = await detectProjectRoot(this.ctx.cwd, this.runner);

    const openSpecEnabled = config.enabled && config.openspec.enabled;
    const hasOpenSpecProject =
      openSpecEnabled && (await pathIsDirectory(join(projectRoot, 'openspec')));
    let openSpecOverview: RefreshOutcome<OpenSpecOverview> = { kind: 'absent' };
    let openspec: RefreshOutcome<OpenSpecState> = { kind: 'absent' };

    if (hasOpenSpecProject) {
      openSpecOverview = await this.outcome('openspec', () =>
        collectOpenSpecOverview({ cwd: projectRoot, runner: this.runner }),
      );
      if (openSpecOverview.kind === 'success') {
        projectRoot = openSpecOverview.value.projectRoot;
      }
    }

    if (focus.mode === 'none') {
      const passiveChange = config.openspec.change ?? process.env.PI_OPENSPEC_CHANGE;
      if (passiveChange) {
        openspec = await this.outcome('openspec', () =>
          collectOpenSpec({
            cwd: projectRoot,
            runner: this.runner,
            configuredChange: passiveChange,
            now: at,
          }),
        );
        if (openspec.kind === 'success') projectRoot = openspec.value.projectRoot;
      }
    } else {
      openspec = await this.outcome('openspec', () =>
        collectOpenSpec({
          cwd: projectRoot,
          runner: this.runner,
          configuredChange: focus.change,
          now: at,
        }),
      );
      if (openspec.kind === 'success') projectRoot = openspec.value.projectRoot;
    }

    const [diagnostics, orchestration] = await Promise.all([
      !config.enabled || !config.diagnostics.enabled
        ? Promise.resolve<RefreshOutcome<DiagnosticsState>>({ kind: 'absent' })
        : this.outcome('diagnostics', async () => {
            const result = await collectDiagnostics({
              projectRoot,
              config: config.diagnostics,
              runner: this.runner,
              runCommand,
              now: at,
            });
            this.diagnosticsPath = result.sourcePath;
            return result.state;
          }),
      !config.enabled || !config.orchestration.enabled
        ? Promise.resolve<RefreshOutcome<OrchestrationState>>({
            kind: 'absent',
          })
        : this.outcome('orchestration', async () => {
            const result = await collectOrchestration({
              projectRoot,
              config: config.orchestration,
              now: at,
            });
            this.orchestrationPath = result.sourcePath;
            return result.state;
          }),
    ]);

    if (
      this.stopped ||
      generation !== this.generation ||
      !sameOpenSpecFocus(focus, this.focus)
    ) {
      return;
    }
    // The gate act is focus-owned commentary: resolved only for a task
    // focus inside an OpenSpec project, after the commit guard, so a
    // superseded refresh never spends a probe on stale truth.
    if (focus.mode === 'task' && hasOpenSpecProject) {
      this.gateAct = {
        change: focus.change,
        line: await resolveGateAct({
          change: focus.change,
          projectRoot,
          runner: this.runner,
        }),
      };
    }
    const previous = this.store.get();
    this.updateRefreshHealth(
      'openspec',
      [openSpecOverview, openspec],
      this.openSpecOverview !== null || previous.openspec !== null,
    );
    this.updateRefreshHealth(
      'diagnostics',
      [diagnostics],
      previous.diagnostics !== null,
    );
    this.updateRefreshHealth(
      'orchestration',
      [orchestration],
      previous.orchestration !== null,
    );
    this.openSpecProjectDetected = openSpecEnabled ? hasOpenSpecProject : undefined;
    if (openSpecOverview.kind === 'success') {
      this.openSpecOverview = openSpecOverview.value;
    } else if (openSpecOverview.kind === 'absent') {
      this.openSpecOverview = undefined;
    }
    this.openSpecFeedback =
      !hasOpenSpecProject || focus.mode === 'task'
        ? undefined
        : openSpecOverview.kind === 'error'
          ? 'unavailable'
          : openSpecOverview.kind === 'success' &&
              openSpecOverview.value.actionableChanges > 0
            ? 'no-focus'
            : 'clear';
    this.store.applyRefresh({
      projectRoot,
      at,
      openspec,
      diagnostics,
      orchestration,
    });
    const refreshed = this.store.get();
    const hierarchy = refreshed.openspec?.hierarchy;
    const recordedAt = Date.now();
    this.recordEvent({
      type: 'progress/refresh',
      at: recordedAt,
      progress: hierarchy
        ? {
            tasks: hierarchy.tasks,
            steps: {
              completed: Object.values(hierarchy.stepsByTask).reduce(
                (sum, entry) => sum + entry.completed,
                0,
              ),
              total: Object.values(hierarchy.stepsByTask).reduce(
                (sum, entry) => sum + entry.total,
                0,
              ),
            },
            freshAt: recordedAt,
          }
        : null,
    });
    this.recordEvent({
      type: 'diagnostics/refresh',
      at: recordedAt,
      state: refreshed.diagnostics,
    });
    this.recordEvent({
      type: 'orchestration/refresh',
      at: recordedAt,
      state: refreshed.orchestration,
    });
    this.configureWatchers();
    this.publish();
  }

  private configureWatchers(): void {
    const snapshot = this.store.get();
    const candidates = new Set<string>();
    if (this.openSpecOverview) {
      candidates.add(join(this.openSpecOverview.projectRoot, 'openspec', 'changes'));
    }
    if (snapshot.openspec) {
      candidates.add(join(snapshot.openspec.projectRoot, 'openspec', 'changes'));
      if (snapshot.openspec.tasksPath) {
        candidates.add(dirname(snapshot.openspec.tasksPath));
      }
    }
    if (this.diagnosticsPath) candidates.add(dirname(this.diagnosticsPath));
    if (this.orchestrationPath) candidates.add(dirname(this.orchestrationPath));

    const paths = [...candidates].sort();
    const signature = paths.join('\n');
    if (signature === this.watchSignature) return;
    this.clearWatchers();
    this.watchSignature = signature;

    const debounceResources = new ResourceBag();
    this.watchCleanups.push(() => debounceResources.close());
    const refreshDebounced = createDebouncer(
      () => this.launch(this.refresh(false), 'watcher'),
      250,
      debounceResources,
    );

    for (const path of paths) {
      try {
        const watcher = watch(path, { persistent: false }, refreshDebounced);
        this.watchCleanups.push(() => watcher.close());
      } catch (error) {
        this.recordError('watcher', `${path}: ${errorMessage(error)}`);
      }
    }
  }

  private clearWatchers(): void {
    for (const cleanup of this.watchCleanups.splice(0).reverse()) {
      try {
        cleanup();
      } catch {
        // Watchers may already be closed after an atomic file replacement.
      }
    }
    this.watchSignature = '';
  }

  private publish(): void {
    if (this.stopped) return;
    const snapshot = this.store.get();
    // Builders read focus facts through the snapshot layer (recordEvent stores
    // the same object references), so output stays byte-identical while the
    // ledger becomes the feeding seam.
    const focus = this.cockpitFacts.openSpec;
    const subject = this.cockpitFacts.subject;
    const title = this.currentTitleState(snapshot);
    const focusedOpenSpec =
      focus.mode === 'task' && snapshot.openspec?.changeId === focus.change
        ? snapshot.openspec
        : null;
    const widgets = buildWidgetSnapshots(
      { ...snapshot, openspec: focusedOpenSpec },
      {
        focusedTaskId: focus.mode === 'task' ? focus.taskId : undefined,
        openSpecFeedback: focus.mode === 'none' ? this.openSpecFeedback : undefined,
        openSpecOverview: this.openSpecOverview,
        openSpecProjectDetected: this.openSpecProjectDetected,
      },
    );
    this.publisher.sync(widgets);
    this.pi.events.emit(
      GALACTICA_HEADER_CHANNEL,
      buildHeaderStatusEvent(widgets, {
        openSpec: focusedOpenSpec,
        focusedTaskId: focus.mode === 'task' ? focus.taskId : undefined,
        subject,
        orchestration: snapshot.orchestration,
        lifecycle: this.liveLifecycle,
        activity: this.liveActivity,
        taskflowPhase: this.liveTaskflowPhase,
        activeRuns: (() => {
          const runs = this.runtimeSpans.snapshot();
          return { children: runs.children, subagents: runs.subagents };
        })(),
        activeRunSpans: this.runtimeSpans.snapshot().spans ?? [],
        idleMs: this.runtimeSpans.idleMs(),
        title,
        turn: this.turnCost.snapshot(),
        diagnostics: snapshot.diagnostics,
      }),
    );
    this.publishStatusHealth();
  }

  private currentTitleState(snapshot = this.store.get()): TitleState {
    const facts = this.cockpitFacts;
    // The left title is Human-owned — session name, subject, directory —
    // never openspec text (truthful-rendered-state law 2026-11-10); the
    // gate act rides the work slot for the right-side tile.
    const gateAct =
      facts.openSpec.mode === 'task' && this.gateAct?.change === facts.openSpec.change
        ? this.gateAct.line
        : undefined;
    const subjectTitle = formatActiveWorkTitle({
      subject: facts.subject,
      ...(this.sessionName ? { sessionName: this.sessionName } : {}),
      projectRoot: snapshot.projectRoot,
      cwd: snapshot.cwd,
    });
    return buildTitleState({
      subject: { state: 'set', title: subjectTitle },
      focus: facts.openSpec,
      openspec: snapshot.openspec,
      activity: this.titleActivity.current(),
      focusAt: this.focusAt,
      ...(gateAct ? { gateAct } : {}),
    });
  }

  private recordEvent(event: LedgerEvent): void {
    this.cockpitFacts = applyEvent(this.cockpitFacts, event);
    this.cockpitVersion += 1;
    this.statusLedger.append(event);
  }

  cockpitSnapshot(): CockpitSnapshot {
    return snapshotFromFacts(this.cockpitFacts, this.cockpitVersion);
  }

  currentFocus(): OpenSpecFocus {
    return this.focus;
  }

  currentSubject(): SessionSubject {
    return this.subject;
  }

  beginTurn(): void {
    this.directToolActivities.clear();
    this.directToolFailed = false;
    this.titleActivity.reset();
    this.turnCost.begin();
    this.turnCounter += 1;
    this.currentTurnId = `turn-${this.turnCounter}`;
    this.runtimeSpans.beginRoot(this.currentTurnId, 'understanding');
    this.syncSpanEvents();
    this.setLiveProjection('understanding', { kind: 'understanding' });
  }

  setFocus(focus: OpenSpecFocus): void {
    if (sameOpenSpecFocus(this.focus, focus)) return;
    this.focus = focus;
    this.focusAt = Date.now();
    if (focus.mode !== 'task' || this.gateAct?.change !== focus.change) {
      this.gateAct = undefined;
    }
    this.recordEvent({ type: 'focus/openspec', at: Date.now(), focus });
    this.store.clearOpenSpec();
    if (focus.mode === 'task' && focus.awaitingValidation) {
      this.setLiveProjection('waiting', { kind: 'awaiting-validation' });
    } else if (focus.mode === 'none') {
      this.setLiveProjection('listening');
    }
    this.publish();
    this.launch(this.refresh(false), 'openspec');
  }

  setSubject(subject: SessionSubject): void {
    if (sameSessionSubject(this.subject, subject)) return;
    this.subject = subject;
    this.recordEvent({ type: 'focus/subject', at: Date.now(), subject });
    this.publish();
  }

  setLiveProjection(lifecycle: HeaderLifecycle, activity?: HeaderActivity): void {
    if (
      this.liveLifecycle === lifecycle &&
      this.liveActivity?.kind === activity?.kind &&
      this.liveActivity?.current === activity?.current &&
      this.liveActivity?.total === activity?.total
    ) {
      return;
    }
    this.liveLifecycle = lifecycle;
    this.liveActivity = activity;
    this.publish();
  }

  setLiveActivity(activity: HeaderActivity | undefined): void {
    this.setLiveProjection(
      headerLifecycleForActivity(activity) ?? this.liveLifecycle,
      activity,
    );
  }

  beginDirectTool(toolCallId: string, activity: HeaderActivity | undefined): void {
    if (!activity) return;
    this.directToolActivities.set(toolCallId, activity);
    this.setLiveActivity(activity);
  }

  finishDirectTool(toolCallId: string, isError: boolean): void {
    const completed = this.directToolActivities.get(toolCallId);
    if (!completed) return;
    this.directToolActivities.delete(toolCallId);
    this.directToolFailed ||= isError;

    const stillRunning = [...this.directToolActivities.values()].at(-1);
    if (stillRunning) {
      this.setLiveActivity(stillRunning);
      return;
    }

    const completion = directToolCompletionHeaderActivity(
      completed,
      this.directToolFailed,
    );
    this.directToolFailed = false;
    this.setLiveActivity(completion);
  }

  beginRuntimeRun(toolCallId: string, toolName: string): void {
    const kind = toolName === 'bash' ? 'bash' : 'subagent';
    if (!this.runtimeSpans.begin(toolCallId, kind, this.currentTurnId)) return;
    this.syncSpanEvents();
    this.publish();
  }

  /** Feed the title-state activity slot from a tool-execution start. */
  beginTitleActivity(toolCallId: string, toolName: string, args: unknown): void {
    if (!this.titleActivity.begin(toolCallId, toolName, args, this.currentTurnId)) {
      return;
    }
    this.publish();
  }

  /** Clear the title-state activity when its authoring call ends — a
   * finished tool never lingers as the live label (quiet-activity-row). */
  finishTitleActivity(toolCallId: string): void {
    if (!this.titleActivity.finish(toolCallId)) return;
    this.publish();
  }

  /** Accumulate one provider response's usage into the per-turn cost meter. */
  recordTurnUsage(message: unknown): void {
    if (!message || typeof message !== 'object' || Array.isArray(message)) return;
    const candidate = message as { role?: unknown; usage?: unknown };
    if (candidate.role !== 'assistant') return;
    if (this.turnCost.addUsage(candidate.usage)) this.publish();
  }

  /** Feed the title-state activity slot from a tool-execution update. */
  updateTitleActivity(
    toolCallId: string,
    toolName: string,
    args: unknown,
    partialResult: unknown,
  ): void {
    if (
      !this.titleActivity.update(
        toolCallId,
        toolName,
        args,
        partialResult,
        this.currentTurnId,
      )
    ) {
      return;
    }
    this.publish();
  }

  private syncSpanEvents(): void {
    const changes = this.runtimeSpans.drainChanges();
    const at = Date.now();
    for (const started of changes.started) {
      this.recordEvent({
        type: 'run/start',
        at,
        span: {
          id: started.id,
          kind: started.kind,
          parent: started.parent,
          ...(started.agent ? { agent: started.agent } : {}),
          ...(started.label ? { label: started.label } : {}),
          stage: started.stage,
          stageDeclared: false,
          since: at,
        },
      });
    }
    for (const ended of changes.ended) {
      this.recordEvent({ type: 'run/end', at, id: ended });
    }
  }

  updateRuntimeRun(toolCallId: string, partialResult: unknown, args?: unknown): void {
    if (!this.runtimeSpans.update(toolCallId, partialResult, args)) return;
    this.syncSpanEvents();
    this.publish();
  }

  finishRuntimeRun(toolCallId: string): void {
    if (!this.runtimeSpans.finish(toolCallId)) return;
    this.syncSpanEvents();
    this.publish();
  }

  setTaskflowPhase(phase: string | undefined): void {
    if (this.liveTaskflowPhase === phase) return;
    this.liveTaskflowPhase = phase;
    if (phase) {
      this.recordEvent({
        type: 'taskflow/phase',
        at: Date.now(),
        phase: boundedPhase(phase),
      });
    }
    if (phase) {
      this.liveLifecycle = taskflowPhaseHeaderLifecycle(phase);
      this.liveActivity = undefined;
    }
    this.publish();
  }

  markAborted(): void {
    this.setLiveProjection('aborted', { kind: 'operation-aborted' });
  }

  markAnswering(): void {
    if (this.liveLifecycle !== 'aborted') {
      this.setLiveProjection('answering', { kind: 'answering' });
    }
  }

  settle(): void {
    this.directToolActivities.clear();
    this.directToolFailed = false;
    this.titleActivity.reset();
    this.turnCost.settle();
    if (this.currentTurnId) {
      this.runtimeSpans.endRoot(this.currentTurnId);
      this.currentTurnId = null;
      this.syncSpanEvents();
    }
    if (this.liveLifecycle === 'aborted') {
      this.publish();
      return;
    }
    if (this.focus.mode === 'task') {
      this.setLiveProjection('waiting', { kind: 'awaiting-validation' });
      return;
    }
    this.setLiveProjection('listening');
  }

  setSessionName(name: string | undefined): void {
    this.sessionName = name;
    this.publish();
  }

  async forceRefresh(): Promise<void> {
    this.loadedConfig = await loadConfig();
    this.store.setConfig(this.loadedConfig.path, this.loadedConfig.warnings);
    await this.refresh(true);
  }

  summary(): string {
    const snapshot = this.store.get();
    const lines = [`root: ${snapshot.projectRoot}`];
    lines.push(
      this.openSpecOverview
        ? `OpenSpec portfolio: ${formatOpenSpecOverview(this.openSpecOverview)}`
        : 'OpenSpec portfolio: hidden (no project)',
    );
    lines.push(
      snapshot.openspec
        ? `OpenSpec focus: ${formatOpenSpec(
            snapshot.openspec,
            this.focus.mode === 'task' ? this.focus.taskId : null,
          )}`
        : this.openSpecFeedback
          ? `OpenSpec focus: ${this.openSpecFeedback}`
          : 'OpenSpec focus: none',
    );
    lines.push(
      snapshot.diagnostics
        ? `Diagnostics: ${formatDiagnostics(snapshot.diagnostics)}`
        : 'Diagnostics: hidden (no source)',
    );
    lines.push(
      snapshot.orchestration
        ? `Orchestration: ${formatOrchestration(snapshot.orchestration)}`
        : 'Orchestration: hidden (no state file)',
    );
    return lines.join('\n');
  }

  debug(): string {
    const snapshot = this.store.get();
    return `${JSON.stringify(
      {
        projectRoot: snapshot.projectRoot,
        configPath: snapshot.configPath,
        configWarnings: snapshot.configWarnings,
        focus: this.focus,
        openSpecFeedback: this.openSpecFeedback ?? null,
        openSpecOverview: this.openSpecOverview ?? null,
        detected: {
          openspecChange: snapshot.openspec?.changeId ?? null,
          openspecTasksPath: snapshot.openspec?.tasksPath ?? null,
          diagnosticsSource:
            snapshot.diagnostics?.meta.source ?? this.diagnosticsPath ?? null,
          orchestrationStateFile:
            snapshot.orchestration?.meta.source ?? this.orchestrationPath ?? null,
        },
        refresh: {
          all: snapshot.lastRefreshAt ?? null,
          openspec: snapshot.openspec?.meta ?? null,
          diagnostics: snapshot.diagnostics?.meta ?? null,
          orchestration: snapshot.orchestration?.meta ?? null,
        },
        errors: snapshot.errors,
        widgets: this.publisher.snapshots(),
      },
      null,
      2,
    )}\n${titleStateDebugLine(this.currentTitleState(snapshot))}`;
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    this.generation += 1;
    this.clearWatchers();
    this.resources.close();
  }
}

export default function galacticaStatus(pi: ExtensionAPI): void {
  const publisher = new FancyFooterPublisher((message) => {
    pi.events.emit(FANCY_FOOTER_WIDGET_CHANNEL, message);
  });
  let runtime: GalacticaStatusRuntime | undefined;

  const stopReady = pi.events.on(FANCY_FOOTER_READY_CHANNEL, (message: unknown) => {
    if (
      typeof message === 'object' &&
      message !== null &&
      'protocol' in message &&
      message.protocol === 1
    ) {
      publisher.republish();
    }
  });

  // work-state owns focus writes and emits `focus-changed` after each
  // successful one (pi.events); the renderer subscribes for immediate
  // repaint (pure-renderer-split Slice 2).
  const stopFocusRepaint = pi.events.on('focus-changed', (data: unknown) => {
    const focus = parseOpenSpecFocus(data);
    if (!focus) return;
    runtime?.setFocus(focus);
    runtime?.settle();
  });

  pi.on('session_start', (_event, ctx) => {
    runtime?.stop();
    const branch = ctx.sessionManager.getBranch();
    const focus = restoreOpenSpecFocus(branch);
    const subject = restoreSessionSubject(branch);
    const sessionName = pi.getSessionName() ?? ctx.sessionManager.getSessionName();
    runtime = new GalacticaStatusRuntime(
      pi,
      ctx,
      publisher,
      focus,
      subject,
      sessionName,
    );
    runtime.start();
  });

  pi.on('session_info_changed', (event) => {
    runtime?.setSessionName(event.name);
  });

  pi.on('session_tree', (_event, ctx) => {
    const branch = ctx.sessionManager.getBranch();
    runtime?.setFocus(restoreOpenSpecFocus(branch));
    runtime?.setSubject(restoreSessionSubject(branch));
    runtime?.settle();
  });

  pi.on('before_agent_start', () => {
    runtime?.beginTurn();
  });

  pi.on('tool_execution_start', (event) => {
    runtime?.beginRuntimeRun(event.toolCallId, event.toolName);
    runtime?.beginTitleActivity(event.toolCallId, event.toolName, event.args);
  });

  pi.on('tool_call', (event) => {
    if (event.toolName !== 'taskflow') {
      runtime?.beginDirectTool(
        event.toolCallId,
        directToolHeaderActivity(event.toolName, event.input),
      );
      return;
    }
    const initialPhase = taskflowInitialHeaderPhase(event.input);
    if (initialPhase) {
      runtime?.setTaskflowPhase(initialPhase);
      return;
    }

    runtime?.setTaskflowPhase(undefined);
    const activity = taskflowCallHeaderActivity(event.input);
    runtime?.setLiveProjection(
      headerLifecycleForActivity(activity) ?? 'working',
      activity,
    );
  });

  pi.on('tool_execution_update', (event) => {
    runtime?.updateRuntimeRun(event.toolCallId, event.partialResult, event.args);
    runtime?.updateTitleActivity(
      event.toolCallId,
      event.toolName,
      event.args,
      event.partialResult,
    );
    if (event.toolName !== 'taskflow') return;
    const phase = taskflowUpdateHeaderPhase(event.partialResult);
    if (phase) runtime?.setTaskflowPhase(phase);
  });

  pi.on('tool_execution_end', (event) => {
    runtime?.finishTitleActivity(event.toolCallId);
    runtime?.finishRuntimeRun(event.toolCallId);
    if (event.toolName !== 'taskflow') {
      runtime?.finishDirectTool(event.toolCallId, event.isError);
      return;
    }
    runtime?.setTaskflowPhase(undefined);
    runtime?.setLiveActivity(undefined);
  });

  pi.on('message_update', (event) => {
    if (assistantHasVisibleText(event.message)) runtime?.markAnswering();
  });

  pi.on('message_end', (event) => {
    runtime?.recordTurnUsage(event.message);
  });

  pi.on('turn_end', (event) => {
    if (assistantStopReason(event.message) === 'aborted') runtime?.markAborted();
  });

  pi.on('agent_end', (event) => {
    if (event.messages.some((message) => assistantStopReason(message) === 'aborted')) {
      runtime?.markAborted();
    }
  });

  pi.on('agent_settled', () => {
    queueMicrotask(() => runtime?.settle());
  });

  pi.on('session_shutdown', () => {
    runtime?.stop();
    runtime = undefined;
    publisher.removeAll();
    stopReady();
    stopFocusRepaint();
  });

  pi.registerCommand('galactica-status', {
    description: 'Show detected project status integrations',
    handler: async (_args, ctx) => {
      ctx.ui.notify(runtime?.summary() ?? 'galactica-status is starting', 'info');
    },
  });

  pi.registerCommand('galactica-status-refresh', {
    description: 'Refresh all enabled Galactica status sources',
    handler: async (_args, ctx) => {
      if (!runtime) {
        ctx.ui.notify('galactica-status is not active', 'warning');
        return;
      }
      await runtime.forceRefresh();
      ctx.ui.notify(runtime.summary(), 'info');
    },
  });

  pi.registerCommand('galactica-status-debug', {
    description: 'Show Galactica status detection and publication details',
    handler: async (_args, ctx) => {
      ctx.ui.notify(runtime?.debug() ?? 'galactica-status is not active', 'info');
    },
  });
}
