import type {
  ExtensionAPI,
  ExtensionContext,
  Theme,
} from '@earendil-works/pi-coding-agent';

import {
  countCompactions,
  FOOTER_TELEMETRY_CHANNEL,
  formatFooterBranch,
  formatFooterPath,
  GALACTICA_HEADER_CHANNEL,
  type FooterTelemetrySnapshot,
  type GitStatusSummary,
  type HeaderSnapshot,
  normalizeContextPercent,
  parseFooterTelemetry,
  parseGitBranch,
  parseGitStatus,
  parseHeaderSnapshot,
  parsePiStatusSnapshot,
  PI_NATIVE_STATUS_CHANNEL,
  PI_STATUS_SNAPSHOT_CHANNEL,
  parseVimMode,
  VIM_MODE_CHANNEL,
  type PiStatusSnapshot,
  type VimMode,
} from './src/gauge.ts';
import {
  LSP_STATUS_EVENT,
  MCP_STATUS_EVENT,
  parseLspCapability,
  parseMcpCapability,
  type LspCapability,
  type McpCapability,
} from './src/capabilities.ts';
import { shouldRefreshGitAfterTool } from './src/git-refresh.ts';
import {
  buildResourceTelemetry,
  calculateCpuPercent,
  RESOURCE_REFRESH_MS,
  sampleProcessTreeResources,
  updateCpuSmoothing,
  type CpuSmoothingState,
  type ProcessTreeSample,
  type ResourceTelemetry,
} from './src/process-resources.ts';
import { renderHeaderDeck } from './src/deck.ts';

const WIDGET_KEY = 'galactica.work-identity';
const PI_STATUS_SOURCE_CHANNEL = 'pi-stardeck:status-source/v1';
const EMPTY_GIT: GitStatusSummary = {
  staged: 0,
  modified: 0,
  untracked: 0,
  conflicts: 0,
};

export interface ContextHeaderModeRail {
  plain: string;
  styled: string;
}

export interface ContextHeaderDeckSurface {
  setRenderer(
    renderer:
      | ((width: number, theme: Theme, modeRail?: ContextHeaderModeRail) => string[])
      | null,
  ): void;
  requestRender(): void;
}

export interface ContextHeaderOptions {
  /** The deck surface is the product: `'deck'` registers the above-editor
   * widget, `'editor-deck'` renders into an embedder's component instead
   * (vim border). The pre-deck legacy title line is retired
   * (simplify-deck-defaults). */
  surface?: 'deck' | 'editor-deck';
  deckSurface?: ContextHeaderDeckSurface;
}

export function installEmptyDeckFooter(
  ctx: ExtensionContext,
  publishStatuses: (statuses: Array<{ key: string; text: string }>) => void = () => {},
  publishAvailability: (available: boolean) => void = () => {},
): () => void {
  ctx.ui.setFooter((_tui, _theme, footerData) => {
    let lastSignature = '';
    let lastAvailability: boolean | undefined;
    return {
      render(): string[] {
        let statuses: Array<{ key: string; text: string }> = [];
        try {
          const getStatuses = (
            footerData as {
              getExtensionStatuses?: () => ReadonlyMap<string, string>;
            }
          ).getExtensionStatuses;
          if (typeof getStatuses !== 'function') throw new Error('unavailable');
          statuses = [...getStatuses.call(footerData)]
            .filter(
              (entry): entry is [string, string] =>
                typeof entry[0] === 'string' &&
                typeof entry[1] === 'string' &&
                entry[1].trim() !== '',
            )
            .map(([key, text]) => ({ key, text }))
            .sort((left, right) => left.key.localeCompare(right.key));
          if (lastAvailability !== true) publishAvailability(true);
          lastAvailability = true;
        } catch {
          if (lastAvailability !== false) publishAvailability(false);
          lastAvailability = false;
        }
        const signature = JSON.stringify(statuses);
        if (signature !== lastSignature) {
          lastSignature = signature;
          publishStatuses(statuses);
        }
        return [];
      },
      invalidate() {},
    };
  });
  return () => ctx.ui.setFooter(undefined);
}

/** Git-style short id of the running Pi session — 8 hex chars of the
 * UUIDv7, undefined when the id does not match the expected shape. */
function shortSessionId(ctx: ExtensionContext): string | undefined {
  const short = ctx.sessionManager.getSessionId().slice(0, 8);
  return /^[0-9a-f]{8}$/u.test(short) ? short : undefined;
}

export default function galacticaContextHeader(
  pi: ExtensionAPI,
  options: ContextHeaderOptions = {},
): void {
  const editorDeckSurface =
    options.surface === 'editor-deck' ? options.deckSurface : undefined;
  let clearWidget: (() => void) | undefined;
  let clearFooter: (() => void) | undefined;
  let requestRender: (() => void) | undefined;
  let branch = '';
  let gitAvailable = false;
  let gitStatus: GitStatusSummary = { ...EMPTY_GIT };
  let header: HeaderSnapshot | null = null;
  let agentBusy = false;
  let lastObservedActivityAt: number | null = null;
  let activityAgeTimer: ReturnType<typeof setInterval> | undefined;
  let sessionGeneration = 0;
  let sessionShortId: string | undefined;
  let activeCwd = '';
  let activeCtx: ExtensionContext | undefined;
  let gitRefreshInFlight = false;
  let gitRefreshQueued = false;
  let resourceTimer: ReturnType<typeof setInterval> | undefined;
  let resourceRefreshInFlight = false;
  let previousResourceSample: ProcessTreeSample | undefined;
  let cpuSmoothing: CpuSmoothingState | undefined;
  let latestResourceTelemetry: ResourceTelemetry | undefined;
  let lastResourceSignature = '';
  let lspCapability: LspCapability | null = null;
  let mcpCapability: McpCapability | null = null;
  let footerTelemetry: FooterTelemetrySnapshot | undefined;
  let piStatus: PiStatusSnapshot | undefined;
  let nativeStatusBridgeAvailable = true;
  let vimMode: VimMode = 'insert';

  const currentHeader = () => header;

  const refreshResources = async (): Promise<void> => {
    if (!activeCtx || resourceRefreshInFlight) return;
    resourceRefreshInFlight = true;
    const generation = sessionGeneration;
    try {
      const sample = await sampleProcessTreeResources();
      if (!activeCtx || generation !== sessionGeneration) return;
      const rawCpuPercent = calculateCpuPercent(previousResourceSample, sample);
      previousResourceSample = sample;
      cpuSmoothing = updateCpuSmoothing(cpuSmoothing, rawCpuPercent);
      const telemetry = buildResourceTelemetry(cpuSmoothing, sample.memoryBytes);
      const signature = [
        Math.round(telemetry.cpuPercent * 10),
        telemetry.memoryBytes,
        telemetry.cpuWarning,
        telemetry.memoryWarning,
      ].join(':');
      latestResourceTelemetry = telemetry;
      if (signature === lastResourceSignature) return;
      lastResourceSignature = signature;
      requestRender?.();
    } finally {
      resourceRefreshInFlight = false;
    }
  };

  const currentActivityAge = (): number | null =>
    agentBusy && lastObservedActivityAt !== null
      ? Math.max(0, Date.now() - lastObservedActivityAt)
      : null;

  const startActivityTicker = (): void => {
    // Duty-cycled: the 50 ms chronometer ticks only while an activity can
    // render — idle sessions cost zero wakeups (simplify-deck-defaults).
    if (activityAgeTimer) return;
    activityAgeTimer = setInterval(refreshActivityAge, 50);
  };

  const stopActivityTicker = (): void => {
    if (activityAgeTimer === undefined) return;
    clearInterval(activityAgeTimer);
    activityAgeTimer = undefined;
  };

  const publishCapabilityHealth = () => {
    const conditions: Array<{
      id: string;
      severity: 'warning';
      summary: string;
    }> = [];
    if (!nativeStatusBridgeAvailable) {
      conditions.push({
        id: 'native-status-api',
        severity: 'warning',
        summary: 'Pi native extension statuses are unavailable',
      });
    }
    if (mcpCapability && mcpCapability.healthy < mcpCapability.total) {
      conditions.push({
        id: 'mcp',
        severity: 'warning',
        summary: `${mcpCapability.total - mcpCapability.healthy} MCP servers need attention`,
      });
    }
    if (lspCapability && lspCapability.healthy < lspCapability.total) {
      conditions.push({
        id: 'lsp',
        severity: 'warning',
        summary: `${lspCapability.total - lspCapability.healthy} LSP servers need attention`,
      });
    }
    pi.events.emit(PI_STATUS_SOURCE_CHANNEL, {
      protocol: 1,
      type: 'snapshot',
      source: 'galactica-context-header',
      conditions,
    });
  };

  const stopLspStatus = pi.events.on(LSP_STATUS_EVENT, (raw) => {
    lspCapability = parseLspCapability(raw);
    requestRender?.();
    publishCapabilityHealth();
  });
  const stopMcpStatus = pi.events.on(MCP_STATUS_EVENT, (raw) => {
    mcpCapability = parseMcpCapability(raw);
    requestRender?.();
    publishCapabilityHealth();
  });
  const stopFooterTelemetry = pi.events.on(FOOTER_TELEMETRY_CHANNEL, (raw) => {
    const next = parseFooterTelemetry(raw);
    if (!next) return;
    footerTelemetry = next;
    requestRender?.();
  });
  const stopPiStatus = pi.events.on(PI_STATUS_SNAPSHOT_CHANNEL, (raw) => {
    const next = parsePiStatusSnapshot(raw);
    if (!next) return;
    piStatus = next;
    requestRender?.();
  });
  const stopVimMode = pi.events.on(VIM_MODE_CHANNEL, (raw) => {
    const next = parseVimMode(raw);
    if (!next) return;
    vimMode = next;
    requestRender?.();
  });
  const stopHeader = pi.events.on(GALACTICA_HEADER_CHANNEL, (raw) => {
    header = parseHeaderSnapshot(raw);
    requestRender?.();
  });

  const markObservedActivity = () => {
    lastObservedActivityAt = Date.now();
    startActivityTicker();
    requestRender?.();
  };

  const clearObservedActivity = () => {
    lastObservedActivityAt = null;
    stopActivityTicker();
  };

  const refreshActivityAge = () => {
    if (currentActivityAge() === null) return;
    requestRender?.();
  };

  pi.on('before_agent_start', (_event, ctx) => {
    if (ctx.mode !== 'tui') return;
    agentBusy = true;
    markObservedActivity();
  });

  pi.on('turn_start', markObservedActivity);
  pi.on('before_provider_request', markObservedActivity);
  pi.on('after_provider_response', markObservedActivity);

  pi.on('message_start', (event) => {
    if (event.message.role === 'assistant') markObservedActivity();
  });

  pi.on('message_update', (event) => {
    if (event.message.role === 'assistant') markObservedActivity();
  });

  pi.on('tool_execution_start', markObservedActivity);
  pi.on('tool_execution_update', markObservedActivity);

  const runGit = async (args: string[], cwd: string) => {
    try {
      return await pi.exec('git', args, { cwd, timeout: 2_000 });
    } catch {
      return undefined;
    }
  };

  const refreshGit = async (): Promise<void> => {
    if (!activeCwd) return;
    if (gitRefreshInFlight) {
      gitRefreshQueued = true;
      return;
    }

    gitRefreshInFlight = true;
    try {
      do {
        gitRefreshQueued = false;
        const generation = sessionGeneration;
        const cwd = activeCwd;
        const [branchResult, statusResult] = await Promise.all([
          runGit(['symbolic-ref', '--short', 'HEAD'], cwd),
          runGit(['status', '--porcelain=v1', '--untracked-files=all'], cwd),
        ]);
        if (generation !== sessionGeneration || cwd !== activeCwd) continue;

        gitAvailable = statusResult?.code === 0;
        branch =
          branchResult?.code === 0
            ? parseGitBranch(String(branchResult.stdout ?? ''))
            : '';
        gitStatus = gitAvailable
          ? parseGitStatus(String(statusResult?.stdout ?? ''))
          : { ...EMPTY_GIT };
        requestRender?.();
      } while (gitRefreshQueued && activeCwd);
    } finally {
      gitRefreshInFlight = false;
    }
  };

  pi.on('session_start', (_event, ctx) => {
    clearWidget?.();
    clearFooter?.();
    clearFooter = undefined;
    stopActivityTicker();
    if (resourceTimer) clearInterval(resourceTimer);
    resourceTimer = undefined;
    ++sessionGeneration;
    activeCtx = ctx;
    sessionShortId = shortSessionId(ctx);
    activeCwd = '';
    branch = '';
    gitAvailable = false;
    gitStatus = { ...EMPTY_GIT };
    header = null;
    agentBusy = false;
    lspCapability = null;
    mcpCapability = null;
    footerTelemetry = undefined;
    piStatus = undefined;
    nativeStatusBridgeAvailable = true;
    vimMode = 'insert';
    resourceRefreshInFlight = false;
    previousResourceSample = undefined;
    cpuSmoothing = undefined;
    latestResourceTelemetry = undefined;
    lastResourceSignature = '';
    clearObservedActivity();
    publishCapabilityHealth();
    if (!ctx.hasUI) return;
    clearFooter = installEmptyDeckFooter(
      ctx,
      (statuses) => {
        pi.events.emit(PI_NATIVE_STATUS_CHANNEL, {
          protocol: 1,
          type: 'snapshot',
          statuses,
        });
      },
      (available) => {
        nativeStatusBridgeAvailable = available;
        publishCapabilityHealth();
      },
    );
    void refreshResources();
    resourceTimer = setInterval(() => void refreshResources(), RESOURCE_REFRESH_MS);
    activeCwd = ctx.cwd;
    void refreshGit();

    const renderDeck = (width: number, theme: Theme): string[] => {
      if (width <= 0) return [];
      const usage = ctx.getContextUsage();
      const contextWindow = usage?.contextWindow ?? ctx.model?.contextWindow;
      const hasContext =
        typeof usage?.percent === 'number' || typeof usage?.tokens === 'number';
      return renderHeaderDeck(
        {
          elapsedMs: currentActivityAge(),
          header: currentHeader(),
          cwd: formatFooterPath(activeCwd || ctx.cwd, process.env.HOME),
          devbox: process.env.DEVBOX_PROJECT_ROOT !== undefined,
          branch: formatFooterBranch(branch, 80),
          gitAvailable,
          git: gitStatus,
          model: ctx.model?.name || ctx.model?.id || 'no model',
          thinking: pi.getThinkingLevel(),
          ...(hasContext
            ? {
                contextPercent: normalizeContextPercent(
                  usage?.percent,
                  usage?.tokens,
                  contextWindow,
                ),
              }
            : {}),
          ...(typeof usage?.tokens === 'number' ? { contextTokens: usage.tokens } : {}),
          ...(typeof contextWindow === 'number' ? { contextWindow } : {}),
          compactionCount: countCompactions(ctx.sessionManager.getBranch()),
          ...(latestResourceTelemetry ? { resources: latestResourceTelemetry } : {}),
          ...(footerTelemetry ? { footerTelemetry } : {}),
          ...(piStatus ? { piStatus } : {}),
          lsp: lspCapability,
          mcp: mcpCapability,
          mode: vimMode,
          ...(sessionShortId !== undefined ? { sessionShortId } : {}),
        },
        width,
        theme,
      );
    };

    if (editorDeckSurface) {
      requestRender = () => editorDeckSurface.requestRender();
      editorDeckSurface.setRenderer(renderDeck);
      clearWidget = () => {
        requestRender = undefined;
        editorDeckSurface.setRenderer(null);
      };
      return;
    }

    ctx.ui.setWidget(
      WIDGET_KEY,
      (tui, theme) => {
        requestRender = () => tui.requestRender();
        return {
          render(width: number): string[] {
            return renderDeck(width, theme);
          },
          invalidate() {},
        };
      },
      { placement: 'aboveEditor' },
    );

    clearWidget = () => {
      requestRender = undefined;
      ctx.ui.setWidget(WIDGET_KEY, undefined);
    };
  });

  pi.on('model_select', () => {
    requestRender?.();
  });

  pi.on('thinking_level_select', () => {
    requestRender?.();
  });
  pi.on('message_end', (event) => {
    if (event.message.role === 'assistant') markObservedActivity();
  });
  pi.on('session_compact', () => {
    requestRender?.();
  });

  pi.on('tool_execution_end', (event) => {
    markObservedActivity();
    if (shouldRefreshGitAfterTool(event.toolName, event.isError)) {
      void refreshGit();
    }
  });

  pi.on('agent_settled', () => {
    agentBusy = false;
    clearObservedActivity();
    requestRender?.();
    void refreshGit();
  });

  pi.on('session_shutdown', () => {
    sessionGeneration += 1;
    activeCwd = '';
    activeCtx = undefined;
    gitAvailable = false;
    agentBusy = false;
    clearObservedActivity();
    if (resourceTimer) clearInterval(resourceTimer);
    resourceTimer = undefined;
    resourceRefreshInFlight = false;
    previousResourceSample = undefined;
    cpuSmoothing = undefined;
    latestResourceTelemetry = undefined;
    lastResourceSignature = '';
    gitRefreshQueued = false;
    clearWidget?.();
    clearWidget = undefined;
    clearFooter?.();
    clearFooter = undefined;
    stopHeader();
    stopLspStatus();
    stopMcpStatus();
    stopPiStatus();
    stopFooterTelemetry();
    stopVimMode();
  });
}
