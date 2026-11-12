import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

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
import {
  renderHeaderDeck,
  renderWarningLine,
  type HeaderDeckState,
} from './src/deck.ts';

const WIDGET_KEY = 'galactica.work-identity';
const WIDGET_KEY_WARNING = 'galactica.deck-warning';
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
  let sessionGeneration = 0;
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
  // Extra-info band (simplify-deck-band): settings-defined default,
  // session toggle via /stardeck-extra. OFF is the daily view.
  let extraInfoVisible = false;

  // Durable default for the extra-info band: `stardeckExtraInfo` boolean
  // in pi-stardeck.json (project .pi/ wins over the agent directory).
  // Missing, malformed, or wrong-typed files fail soft to OFF.
  const readExtraInfoDefault = (cwd: string): boolean => {
    const candidates = [
      ...(cwd ? [join(cwd, '.pi', 'pi-stardeck.json')] : []),
      join(homedir(), '.pi', 'agent', 'pi-stardeck.json'),
    ];
    for (const candidate of candidates) {
      try {
        const parsed: unknown = JSON.parse(readFileSync(candidate, 'utf8'));
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          continue;
        }
        const value = (parsed as Record<string, unknown>).stardeckExtraInfo;
        if (typeof value === 'boolean') return value;
      } catch {
        // Unreadable or invalid settings fall through to the next candidate.
      }
    }
    return false;
  };

  pi.registerCommand('stardeck-extra', {
    description: 'Toggle the deck extra-info band (telemetry row)',
    handler: async () => {
      extraInfoVisible = !extraInfoVisible;
      requestRender?.();
    },
  });

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
    if (resourceTimer) clearInterval(resourceTimer);
    resourceTimer = undefined;
    ++sessionGeneration;
    activeCtx = ctx;
    activeCwd = '';
    branch = '';
    gitAvailable = false;
    gitStatus = { ...EMPTY_GIT };
    header = null;
    lspCapability = null;
    mcpCapability = null;
    footerTelemetry = undefined;
    piStatus = undefined;
    nativeStatusBridgeAvailable = true;
    vimMode = 'insert';
    extraInfoVisible = readExtraInfoDefault(ctx.cwd);
    resourceRefreshInFlight = false;
    previousResourceSample = undefined;
    cpuSmoothing = undefined;
    latestResourceTelemetry = undefined;
    lastResourceSignature = '';
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

    // One width-free state builder feeds both surfaces of the cockpit
    // (move-warning-below-prompt): the deck above the editor and the
    // warning line below it read the same live truth.
    const deckState = (): HeaderDeckState => {
      const usage = ctx.getContextUsage();
      const contextWindow = usage?.contextWindow ?? ctx.model?.contextWindow;
      const hasContext =
        typeof usage?.percent === 'number' || typeof usage?.tokens === 'number';
      return {
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
        extraInfo: extraInfoVisible,
      };
    };

    const renderDeck = (width: number, theme: Theme): string[] => {
      if (width <= 0) return [];
      return renderHeaderDeck(deckState(), width, theme);
    };

    const renderWarning = (width: number, theme: Theme): string[] => {
      if (width <= 0) return [];
      return renderWarningLine(deckState(), width, theme);
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

    const widgetComponent =
      (render: (width: number, theme: Theme) => string[]) =>
      (tui: unknown, theme: Theme) => {
        requestRender = () => (tui as { requestRender(): void }).requestRender();
        return {
          render(width: number): string[] {
            return render(width, theme);
          },
          invalidate() {},
        };
      };

    // The deck rides above the editor (galactica.work-identity); the
    // aggregated warning speaks below the prompt
    // (galactica.deck-warning, move-warning-below-prompt 2026-11-11).
    ctx.ui.setWidget(WIDGET_KEY, widgetComponent(renderDeck), {
      placement: 'aboveEditor',
    });
    ctx.ui.setWidget(WIDGET_KEY_WARNING, widgetComponent(renderWarning), {
      placement: 'belowEditor',
    });

    clearWidget = () => {
      requestRender = undefined;
      ctx.ui.setWidget(WIDGET_KEY, undefined);
      ctx.ui.setWidget(WIDGET_KEY_WARNING, undefined);
    };
  });

  pi.on('model_select', () => {
    requestRender?.();
  });

  pi.on('thinking_level_select', () => {
    requestRender?.();
  });
  pi.on('session_compact', () => {
    requestRender?.();
  });

  pi.on('tool_execution_end', (event) => {
    if (shouldRefreshGitAfterTool(event.toolName, event.isError)) {
      void refreshGit();
    }
  });

  pi.on('agent_settled', () => {
    void refreshGit();
  });

  pi.on('session_shutdown', () => {
    sessionGeneration += 1;
    activeCwd = '';
    activeCtx = undefined;
    gitAvailable = false;
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
