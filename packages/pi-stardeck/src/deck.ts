import type { Theme } from '@earendil-works/pi-coding-agent';
import { truncateToWidth, visibleWidth } from '@earendil-works/pi-tui';

import type { LspCapability, McpCapability } from './capabilities.ts';
import type { HeaderSelection } from './gauge.ts';
import type {
  FooterTelemetrySnapshot,
  GitStatusSummary,
  HeaderActivity,
  HeaderSnapshot,
  PiStatusSnapshot,
  VimMode,
} from './gauge.ts';
import type { ResourceTelemetry } from './process-resources.ts';
import { formatDeckCountdown } from './gauge.ts';
import { formatDeckWorkLabel } from './title-state.ts';

export interface HeaderDeckModeRail {
  plain: string;
  styled: string;
}

export interface HeaderDeckState {
  elapsedMs: number | null;
  idleMs?: number;
  header: HeaderSnapshot | null;
  cwd: string;
  devbox: boolean;
  branch: string;
  gitAvailable: boolean;
  git: GitStatusSummary;
  model: string;
  thinking?: string;
  contextPercent?: number;
  contextTokens?: number;
  contextWindow?: number;
  compactionCount: number;
  resources?: ResourceTelemetry;
  footerTelemetry?: FooterTelemetrySnapshot;
  piStatus?: PiStatusSnapshot;
  lsp: LspCapability | null;
  mcp: McpCapability | null;
  mode: VimMode;
}

const ANSI_ESCAPE = new RegExp(
  '\\u001b(?:\\][\\s\\S]*?(?:\\u0007|\\u001b\\\\)|\\[[0-?]*[ -/]*[@-~]|[@-_])',
  'gu',
);
const CONTROL_CHARACTER = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f]', 'gu');
const TRAILING_ANSI_ESCAPE =
  /\u001b(?:\][\s\S]*?(?:\u0007|\u001b\\)|\[[0-?]*[ -/]*[@-~]|[@-_])\s*$/u;

function safeText(value: string, maximum = 180): string {
  return Array.from(
    value
      .replace(ANSI_ESCAPE, '')
      .replace(CONTROL_CHARACTER, ' ')
      .replaceAll('󰠭', '')
      .replace(/\s+/gu, ' ')
      .trim(),
  )
    .slice(0, maximum)
    .join('');
}

function color(theme: Theme, name: string, text: string, bold = false): string {
  const content = bold ? theme.bold(text) : text;
  return theme.fg(name as Parameters<Theme['fg']>[0], content);
}

function fit(line: string, width: number): string {
  return truncateToWidth(line, Math.max(0, width), '');
}

function trimTrailingFormatting(line: string): string {
  let trimmed = line.trimEnd();
  while (TRAILING_ANSI_ESCAPE.test(trimmed)) {
    trimmed = trimmed.replace(TRAILING_ANSI_ESCAPE, '').trimEnd();
  }
  return trimmed;
}

function fitWithoutDanglingSeparator(line: string, width: number): string {
  let fitted = fit(line, width);
  while (true) {
    const visible = fitted.replace(ANSI_ESCAPE, '').trimEnd();
    const separator = visible.at(-1);
    if (separator !== '›' && separator !== '⟩') return fitted;
    fitted = trimTrailingFormatting(fitted.slice(0, fitted.lastIndexOf(separator)));
  }
}

export function formatDeckElapsed(elapsedMs: number | null): string {
  const maximum = (999 * 60 + 59) * 1_000 + 999;
  const observed = elapsedMs ?? 0;
  const finite = Number.isFinite(observed)
    ? observed
    : observed === Number.POSITIVE_INFINITY
      ? maximum
      : 0;
  const normalized = Math.min(maximum, Math.max(0, Math.floor(finite)));
  const minutes = Math.floor(normalized / 60_000);
  const seconds = Math.floor((normalized % 60_000) / 1_000);
  const centiseconds = Math.floor((normalized % 1_000) / 10);
  return `${String(minutes).padStart(3, '0')}:${String(seconds).padStart(2, '0')}'${String(centiseconds).padStart(2, '0')}`;
}

export function formatDeckPercent(value: number): string {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return `${Math.round(normalized)}%`;
}

export function formatDeckCpu(value: number): string {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return `${normalized.toFixed(1)}%`;
}

export function formatDeckBytes(value: number): string {
  const units = ['', 'K', 'M', 'G', 'T'];
  let normalized = Number.isFinite(value) ? Math.max(0, value) : 0;
  let unit = 0;
  while (normalized >= 1024 && unit < units.length - 1) {
    normalized /= 1024;
    unit += 1;
  }
  const decimals = unit > 0 && normalized < 10 ? 1 : 0;
  return `${normalized.toFixed(decimals).replace(/\.0$/u, '')}${units[unit]}`;
}

function formatCost(value: number): string {
  const normalized = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (normalized === 0) return '$0';
  const decimals =
    normalized >= 0.01
      ? 2
      : Math.min(6, Math.max(3, Math.ceil(-Math.log10(normalized)) + 1));
  return `$${normalized.toFixed(decimals).replace(/\.?0+$/u, '')}`;
}

function wrapFocus(text: string, width: number, maximumLines: number): string[] {
  const words = safeText(text, 360).split(' ').filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (visibleWidth(candidate) <= width) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maximumLines) break;
  }
  if (lines.length < maximumLines && current) lines.push(current);
  if (words.length > 0 && lines.length === maximumLines) {
    lines[maximumLines - 1] = truncateToWidth(
      lines[maximumLines - 1] ?? '',
      width,
      '…',
    );
  }
  return lines.slice(0, maximumLines);
}

function titleBandLines(state: HeaderDeckState, width: number, theme: Theme): string[] {
  // Line 2 anchor: the clock always leads the band with its icon; the
  // Subject follows when the title state carries one, and a fresh session
  // (subject null) leaves the clock leading alone — no dangling separator.
  // Task 3.1: the unfocused open-goal hint left this band for the notice
  // slot (design: "notices absorb the unfocused open-goal hint").
  const clock = `${color(theme, 'customMessageLabel', '󰠭')} ${timerTile(state, theme)}`;
  const title = state.header?.title ?? null;
  if (title) {
    const subject = safeText(title.subject ?? '');
    if (!subject) {
      // Human amendment 2026-10-19: the empty slot renders its dim
      // placeholder — mirroring the Work side's `— no change owns the
      // moment` — instead of leaving the clock leading alone.
      return focusWrapLines('— no subject', clock, width, theme, 'dim');
    }
    return focusWrapLines(subject, clock, width, theme, 'accent');
  }
  // Pre-title publishers: the legacy selection keeps the band alive.
  const selection = state.header?.selection;
  const titles = (selection?.titles ?? [])
    .map((value) => safeText(value))
    .filter(Boolean);
  if (!selection || titles.length === 0) {
    if (!state.header) {
      // Frozen contract: a publisher that reports nothing at all keeps
      // the collapsed frame — clock alone, no placeholder dashes.
      return [clock];
    }
    // Amendment: a live session (header present, Work rendering) that
    // simply has no subject gets the dim placeholder — the title slot
    // never renders empty when the session is talking to us.
    return focusWrapLines('— no subject', clock, width, theme, 'dim');
  }
  const selectionColor = ['accent', 'success'].includes(selection.color)
    ? 'accent'
    : selection.color;
  return focusWrapLines(titles.join(' › '), clock, width, theme, selectionColor);
}

function focusWrapLines(
  content: string,
  clock: string,
  width: number,
  theme: Theme,
  contentColor: string,
): string[] {
  const lead = `${clock} ${semanticSeparator(theme)} `;
  const indent = ' '.repeat(visibleWidth(lead));
  const contentWidth = Math.max(1, width - visibleWidth(lead));
  return wrapFocus(content, contentWidth, 2).map(
    (line, index) =>
      `${index === 0 ? lead : indent}${color(theme, contentColor, line)}`,
  );
}

function semanticSeparator(theme: Theme): string {
  return color(theme, 'thinkingHigh', '⟩', true);
}

function minorSeparator(theme: Theme, semanticColor = 'accent'): string {
  return color(theme, semanticColor, '›');
}
function loud(theme: Theme, name: string, text: string): string {
  return `\u001b[7m${color(theme, name, text, true)}\u001b[27m`;
}

function alignedSingleRow(left: string, right: string, width: number): string {
  if (!right) return fit(left, width);
  const rightWidth = visibleWidth(right);
  if (rightWidth >= width) return fit(right, width);
  const fittedLeft = truncateToWidth(left, width - rightWidth - 1, '…');
  const gap = Math.max(1, width - visibleWidth(fittedLeft) - rightWidth);
  return `${fittedLeft}${' '.repeat(gap)}${right}`;
}

function workTile(state: HeaderDeckState, theme: Theme): string {
  // Line 2 right: Work — derived from OpenSpec focus, never authored here.
  // A fresh session keeps the slot with the accepted dim hint; pre-title
  // publishers leave it silent (absent facts remove their slots).
  const title = state.header?.title ?? null;
  if (!title) return '';
  const work = title.work;
  if (!work) return color(theme, 'dim', '— no change owns the moment');
  return color(
    theme,
    work.total > 0 && work.done >= work.total ? 'success' : 'text',
    formatDeckWorkLabel(work),
  );
}

// Relocation phase (Human-directed): the clock leads the title band beside
// the anchor, runs ride the lifecycle row, and Work keeps the title's
// right end — real values when live, the dim hint when idle.
function timerTile(state: HeaderDeckState, theme: Theme): string {
  const elapsed = state.elapsedMs;
  const idle = state.idleMs;
  return elapsed != null
    ? color(theme, 'accent', formatDeckElapsed(elapsed))
    : color(theme, 'dim', formatDeckElapsed(idle ?? 0));
}

function spanElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}'${String(seconds).padStart(2, '0')}`;
}

function spanTreeRows(state: HeaderDeckState, width: number, theme: Theme): string[] {
  // Frozen contract runs fact: one elastic row per live child run, naming its
  // agent and stage; the rows collapse the moment the spans settle.
  if (width < 60) return [];
  const spans = (state.header?.activeRunSpans ?? []).filter(
    (span) => span.agent !== undefined || span.kind === 'bash',
  );
  return spans.map((span, index) => {
    const branch = index === spans.length - 1 ? '└' : '├';
    const who = span.agent ?? span.label ?? span.kind;
    // Gruvbox brown (dim in this theme), never bare black nor violet.
    // Relocation: the age rides inline beside its branch glyph.
    const row = color(
      theme,
      'dim',
      `  ${branch} (${spanElapsed(span.elapsedMs)}) ${who} ${span.stage}`,
    );
    return truncateToWidth(row, Math.max(1, width), '…');
  });
}

const ACTIVITY_LABELS: Record<HeaderActivity['kind'], string> = {
  understanding: 'interpreting',
  inspection: 'inspecting',
  synthesis: 'synthesizing',
  planning: 'planning',
  'skill-proposal': 'proposing skill',
  mutation: 'updating',
  implementation: 'implementing',
  'change-review': 'reviewing change',
  regression: 'testing',
  verification: 'checking',
  'result-review': 'reviewing result',
  recovery: 'recovering',
  'awaiting-validation': 'validation',
  'awaiting-input': 'input',
  'operation-aborted': 'stopped',
};

function activityLabel(state: HeaderDeckState): string {
  const pathActivity = state.header?.work?.activityPath?.at(-1);
  const pathLabel = safeText(pathActivity?.compact || pathActivity?.label || '');
  if (pathLabel) return pathLabel;
  const activity = state.header?.work?.activity;
  return activity ? ACTIVITY_LABELS[activity.kind] : '';
}

/** `editing deck.ts` / `reading schema.yaml` / `subagent: scout`. */
function titleActivityLabel(activity: { class: string; target: string }): string {
  return activity.class === 'subagent'
    ? `subagent: ${activity.target}`
    : `${activity.class} ${activity.target}`;
}

function activityTile(state: HeaderDeckState, theme: Theme): string {
  // Line 3 left: the observed activity owns the slot — `awaiting Human`
  // when idle, the legacy observed label for pre-title publishers.
  const title = state.header?.title ?? null;
  if (title) {
    return title.activity
      ? color(theme, 'text', titleActivityLabel(title.activity))
      : color(theme, 'dim', 'awaiting Human');
  }
  const legacy = activityLabel(state);
  return legacy ? color(theme, 'text', legacy) : color(theme, 'dim', 'awaiting Human');
}

function formatTurnElapsed(ms: number): string {
  // Matches the turn meter's span-idle ceiling: 99m59s999ms → `99:59`.
  const bounded = Math.min(
    (99 * 60 + 59) * 1_000 + 999,
    Math.max(0, Math.floor(Number.isFinite(ms) ? ms : 0)),
  );
  const totalSeconds = Math.floor(bounded / 1_000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function turnCostTile(state: HeaderDeckState, theme: Theme): string {
  // Line 3 right: the per-turn cost meter. Idle renders the accepted
  // `— · 0 tok`; pre-title publishers (no meter) stay silent.
  const turn = state.header?.turn ?? null;
  if (!turn) return '';
  if (turn.tokens <= 0 && turn.elapsedMs <= 0) {
    return color(theme, 'dim', '— · 0 tok');
  }
  return color(
    theme,
    'accent',
    `this turn ${formatTokens(turn.tokens)} · ${formatTurnElapsed(turn.elapsedMs)}`,
  );
}

function gitRight(state: HeaderDeckState, theme: Theme): string {
  // Gray-out amendment (Human-directed): absent Git shows a dim marker.
  if (!state.branch && !state.gitAvailable) {
    return color(theme, 'dim', ` (no Git)`);
  }
  const branch = color(
    theme,
    state.branch ? 'success' : 'dim',
    ` ${safeText(state.branch || '(detached)', 32)}`,
  );
  const entries = [
    [state.git.staged, 'success', ''],
    [state.git.modified, 'warning', ''],
    [state.git.untracked, 'accent', ''],
    [state.git.conflicts, 'error', ''],
  ] as const;
  const dirty = entries
    .filter(([count]) => count > 0)
    .map(([count, semanticColor, icon]) =>
      color(theme, semanticColor, `${icon} ${count}`),
    );
  const status = !state.gitAvailable
    ? ''
    : dirty.length > 0
      ? dirty.join(` ${minorSeparator(theme)} `)
      : color(theme, 'success', ' clean');
  if (!status) return branch;
  return `${branch} ${minorSeparator(theme)} ${status}`;
}

function globalLeft(state: HeaderDeckState, theme: Theme): string {
  return `${color(theme, 'accent', `󰚩 ${safeText(state.model, 80)}`)} ${minorSeparator(theme)} ${color(theme, state.thinking ? 'thinkingHigh' : 'dim', safeText(state.thinking || 'off', 16))}`;
}

function projectDeckLeft(state: HeaderDeckState, theme: Theme, width: number): string {
  // Line 1 left: the path; the git segment yields below 79 columns before
  // the path does. The devbox marker moved to the line-1 corner with the
  // companion chips (deck-machine-corner); the identity cluster never
  // drops, so the path never carries it again.
  const path = color(theme, 'success', `\u{F07B} ${safeText(state.cwd)}`);
  const gitSegment =
    width >= 79 ? truncateToWidth(gitRight(state, theme), 52, '…') : '';
  return gitSegment ? `${path} ${semanticSeparator(theme)} ${gitSegment}` : path;
}

type CompanionSpec = {
  keys: readonly string[];
  icons: readonly string[];
};

const KNOWN_COMPANION_ICONS: ReadonlyArray<CompanionSpec> = [
  { keys: ['engram'], icons: ['\u{21BB}'] },
  { keys: ['graphify'], icons: ['\u{232C}'] },
  { keys: ['appa', 'openappa'], icons: ['\u{26E8}'] },
];

// Severity-shaped chips: shape is the grayscale-proof channel — [] wraps
// error-or-off, () wraps degraded, bare is healthy — while color keeps the
// fine grain underneath (off muted, degraded warning, error error,
// healthy accent/success). Mnemonic: the more enclosed, the worse.
const COMPANION_DEGRADE_PATTERN = /(warn|stale|update recommended|needs attention)/iu;
const COMPANION_ERROR_PATTERN = /(error|fail|down|unreachable|unhealthy)/iu;

type ChipSeverity = 'healthy' | 'degraded' | 'error' | 'off';

function companionSeverity(text: string | undefined): ChipSeverity {
  // Error-grade words outrank degrade-grade when both appear.
  if (text === undefined) return 'off';
  if (COMPANION_ERROR_PATTERN.test(text)) return 'error';
  if (COMPANION_DEGRADE_PATTERN.test(text)) return 'degraded';
  return 'healthy';
}

function renderChip(
  theme: Theme,
  severity: ChipSeverity,
  healthyColor: string,
  icons: string,
): string {
  // Human verdict 2026-10-19 — variant C of scripts/chips-preview.mjs:
  // bold foreground colors alone. No enclosures, no reverse-video.
  // Blue = healthy/OK, yellow = degraded, red = error/off/KO; the
  // notice slot carries the why (off vs error read identically here).
  const name =
    severity === 'healthy'
      ? healthyColor
      : severity === 'degraded'
        ? 'warning'
        : 'error';
  return color(theme, name, icons, true);
}

function identityCluster(
  state: HeaderDeckState,
  theme: Theme,
): { text: string; trailingBare: boolean } {
  // Line-1 corner identity: devbox lead chip, then the companion chips.
  // Returns the assembled text plus whether the last chip is bare — bare
  // chips keep the wide gap to their right (0.7.1 amendment: the major
  // separator rides double-spaced after a bare trailing chip, matching
  // the bare→bare chip spacing).
  const texts = new Map<string, string>();
  for (const item of state.piStatus?.nativeStatuses ?? []) {
    if (item.key === 'goal' || texts.has(item.key)) continue;
    texts.set(item.key, item.text);
  }
  const parts: string[] = [];
  {
    // Human amendment 2026-10-19: the devbox chip never appears or
    // disappears — in-devbox renders bold blue OK, outside renders
    // bold red KO. DEVBOX_PROJECT_ROOT at pi launch decides.
    parts.push(
      renderChip(theme, state.devbox ? 'healthy' : 'error', 'accent', '\u{F01A7}'),
    );
  }
  for (const companion of KNOWN_COMPANION_ICONS) {
    const published = companion.keys
      .map((key) => texts.get(key))
      .find((text) => text !== undefined);
    for (const key of companion.keys) texts.delete(key);
    parts.push(
      renderChip(
        theme,
        companionSeverity(published),
        'accent',
        companion.icons.join(' '),
      ),
    );
  }
  // Human fix 2026-10-19 (round 2): graphify `⌬` and appa `⛨` render
  // two cells wide but sit tight within them — every wide chip gets an
  // extra space on its RIGHT (double gap after ⌬ and ⛨, single
  // everywhere else).
  let text = '';
  let previousWide = false;
  for (const part of parts) {
    text += text === '' ? part : `${previousWide ? '  ' : ' '}${part}`;
    previousWide = isWideChipIcon(part);
  }
  // trailingBare now means "wide gap after the cluster" — the caller
  // derives its corner separator gap from it; a wide trailing chip (⛨)
  // keeps its right-breathing space before the major separator.
  return { text, trailingBare: previousWide };
}

const WIDE_CHIP_ICONS = new Set(['\u{232C}', '\u{26E8}']);

function isWideChipIcon(icons: string): boolean {
  return [...icons].every((glyph) => WIDE_CHIP_ICONS.has(glyph));
}

const BLOCKED_NOTICE = '\u26d4 blocked';
const APPROVAL_NOTICE = 'approval required';

function companionWarningTexts(state: HeaderDeckState): string[] {
  // Same sources as the capability-health chips: the known companions'
  // native-status texts, goal key filtered, ranked after blocked/approval.
  const texts = new Map<string, string>();
  for (const item of state.piStatus?.nativeStatuses ?? []) {
    if (item.key === 'goal' || texts.has(item.key)) continue;
    texts.set(item.key, item.text);
  }
  const warnings: string[] = [];
  for (const companion of KNOWN_COMPANION_ICONS) {
    const published = companion.keys
      .map((key) => texts.get(key))
      .find((text) => text !== undefined);
    const severity = companionSeverity(published);
    if (published !== undefined && (severity === 'degraded' || severity === 'error')) {
      warnings.push(safeText(published, 180));
    }
  }
  return warnings;
}

/**
 * Aggregate the deck's scattered warning signals into one notice slot
 * (Task 3.1). Ranked per the spec's accepted mixed render: the unfocused
 * open-goal hint, then the companion group (blocked, approval, warning
 * texts), then the diagnostics count — `·`-joined, empty when clean.
 */
export function collectDeckNotices(state: HeaderDeckState): string[] {
  const header = state.header;
  const openGoals = header?.selection?.source === 'goal' ? 0 : (header?.openGoals ?? 0);
  const notices: string[] = [];
  if (openGoals > 0) {
    notices.push(`${openGoals} open goal${openGoals === 1 ? '' : 's'} · /goal-focus`);
  }
  if (header?.blocked) notices.push(BLOCKED_NOTICE);
  if (header?.approvalRequired) notices.push(APPROVAL_NOTICE);
  notices.push(...companionWarningTexts(state));
  const diagnostics = header?.diagnostics?.count;
  if (diagnostics !== undefined && diagnostics > 0) {
    notices.push(`${diagnostics} diagnostic${diagnostics === 1 ? '' : 's'}`);
  }
  // Task 3.2: a set waiver suppresses exactly its matching notice text
  // (suppression-only pending Human review); absence restores the notice.
  const waiver = header?.title?.waiver ?? null;
  return waiver ? notices.filter((notice) => notice !== waiver.notice) : notices;
}

function noticeTile(state: HeaderDeckState, theme: Theme): string {
  const notices = collectDeckNotices(state);
  if (notices.length === 0) return '';
  // Blocked carries the error severity it wore on the deleted lifecycle
  // tile; every other notice renders at warning.
  const semantic = notices.includes(BLOCKED_NOTICE) ? 'error' : 'warning';
  return color(theme, semantic, `⚠ ${notices.join(' · ')}`);
}

function telemetryRowLeft(state: HeaderDeckState, theme: Theme): string {
  // Line 4 left (deck-corner-context amendment): the global group —
  // engine › thinking, then the long-horizon quota — owns the row's left
  // end; the notice slot owns the right end (Task 3). Context and
  // compaction live in the line-1 corner now.
  return modelGroupLeft(state, theme);
}

export function machineCornerSegments(
  state: HeaderDeckState,
  theme: Theme,
  nowMs = Date.now(),
): string[] {
  // Machine corner (deck-machine-corner; deck-corner-context): icon-led
  // machine readings for the line-1 corner — coding quota flame with its
  // countdown, CPU, memory, MCP availability, context percent, summary
  // (compaction) count, global cost — in that frozen order, joined by
  // minor separators. Segments yield right-to-left on narrow frames.
  const segments: string[] = [];
  const flame = windowQuotaTiles(state, theme, nowMs);
  if (flame !== '') segments.push(flame);
  const resources = state.resources;
  if (resources) {
    const resourceColor =
      resources.cpuWarning || resources.memoryWarning ? 'warning' : 'accent';
    segments.push(
      color(theme, resourceColor, `\u{F035B} ${formatDeckCpu(resources.cpuPercent)}`),
    );
    segments.push(
      color(
        theme,
        resourceColor,
        `\u{F061A} ${formatDeckBytes(resources.memoryBytes)}`,
      ),
    );
  }
  if (state.mcp) {
    segments.push(color(theme, 'accent', `${state.mcp.healthy}/${state.mcp.total}`));
  }
  // deck-corner-context: context and summary counts ride the corner.
  // Context wears warning at ≥ 85% (the threshold it carried engine-left);
  // the summary count follows the context color as before.
  const ctxColor =
    state.contextPercent !== undefined && state.contextPercent >= 85
      ? 'warning'
      : state.contextPercent === undefined
        ? 'dim'
        : 'accent';
  if (state.contextPercent !== undefined) {
    segments.push(
      color(theme, ctxColor, `\u{F0F86} ${formatDeckPercent(state.contextPercent)}`),
    );
  }
  if (state.compactionCount > 0) {
    segments.push(color(theme, ctxColor, `\u{F039E} ${state.compactionCount}`));
  }
  const cost = costTile(state, theme);
  if (cost !== '') segments.push(cost);
  return segments;
}

function deckCornerRight(
  state: HeaderDeckState,
  theme: Theme,
  width: number,
  nowMs = Date.now(),
): string {
  // Line 1 corner: the identity cluster (devbox lead, companion chips)
  // split from the machine group by one major separator. A bare trailing
  // chip keeps the wide gap before the separator (0.7.1 amendment);
  // machine segments yield right-to-left (cost first) before the path
  // truncates below a 20-column floor; the identity cluster never drops
  // (always-visible contract).
  const identity = identityCluster(state, theme);
  const segments = machineCornerSegments(state, theme, nowMs);
  const pathFloor = 20;
  const cornerGap = identity.trailingBare ? '  ' : ' ';
  for (let keep = segments.length; keep >= 0; keep -= 1) {
    const tail = segments.slice(0, keep).join(` ${minorSeparator(theme)} `);
    const corner =
      tail === ''
        ? identity.text
        : `${identity.text}${cornerGap}${semanticSeparator(theme)} ${tail}`;
    if (keep === 0 || width - visibleWidth(corner) - 1 >= pathFloor) {
      return corner;
    }
  }
  return identity.text;
}

function modelGroupLeft(state: HeaderDeckState, theme: Theme): string {
  // Line 4 left (deck-corner-context): fully global — model › thinking,
  // then the long-horizon quota (weekly calendar, or whole-session
  // percent when no windows exist). Context and compaction moved to the
  // line-1 corner.
  const quota = simpleQuotaTile(state, theme);
  return quota
    ? [globalLeft(state, theme), semanticSeparator(theme), quota].join(' ')
    : globalLeft(state, theme);
}

function simpleQuotaTile(state: HeaderDeckState, theme: Theme): string {
  const telemetry = state.footerTelemetry;
  if (!telemetry) return '';
  const windows = telemetry.quotaWindows ?? [];
  if (windows.length === 0) {
    const quota = telemetry.quotaPercent;
    if (quota === undefined) return '';
    const quotaColor = quota >= 80 ? 'error' : quota >= 60 ? 'warning' : 'accent';
    return color(theme, quotaColor, ` ${formatDeckPercent(quota)}`);
  }
  // With windows, the long-range calendar tile joins the left group; the
  // coding flame stays with the live resources on the right.
  const calendar = windows.find((window) => /^[\d.]+d$/u.test(window.label));
  if (!calendar) return '';
  return color(
    theme,
    calendar.percent >= 80 ? 'error' : calendar.percent >= 60 ? 'warning' : 'accent',
    `󰃰 ${formatDeckPercent(calendar.percent)}`,
  );
}

function windowQuotaTiles(
  state: HeaderDeckState,
  theme: Theme,
  nowMs = Date.now(),
): string {
  const telemetry = state.footerTelemetry;
  const windows = telemetry?.quotaWindows ?? [];
  if (windows.length === 0) return '';
  // Icons carry window identity: minute/hour windows are the coding window and
  // wear the permanent flame with its reset countdown; day windows are the long
  // window on the calendar. Telemetry lists windows shortest-first, so the
  // first of each class is the tightest one.
  const coding = windows.find((window) => /^[\d.]+[mh]$/u.test(window.label));
  const tiles: string[] = [];
  if (coding) {
    tiles.push(
      color(
        theme,
        coding.percent >= 80 ? 'error' : coding.percent >= 60 ? 'warning' : 'accent',
        coding.resetAt !== undefined
          ? `󰈸 ${formatDeckPercent(coding.percent)} › 󰅐 ${formatDeckCountdown(coding.resetAt, nowMs)}`
          : `󰈸 ${formatDeckPercent(coding.percent)}`,
      ),
    );
  }
  return tiles.join(` ${semanticSeparator(theme)} `);
}

function costTile(state: HeaderDeckState, theme: Theme): string {
  const telemetry = state.footerTelemetry;
  if (!telemetry) return '';
  return color(theme, 'accent', `󰜦 ${formatCost(telemetry.totalCost)}`);
}

function statusAlertTile(
  state: HeaderDeckState,
  width: number,
  theme: Theme,
  lineColor: string,
): string {
  // Line 1 rider (2.4 amendment): the severity counts formerly opened the
  // deleted line-1 rule; they now ride line 1's right end beside the
  // companion chips, compacting — drop the command, then merge to one
  // count, then yield — before the always-visible chips ever do.
  const errors = state.piStatus?.errors ?? 0;
  const warnings = state.piStatus?.warnings ?? 0;
  if (errors === 0 && warnings === 0) return '';

  const groups = [
    errors > 0 ? loud(theme, 'error', `󰅙 ${errors}`) : '',
    warnings > 0 ? loud(theme, 'warning', ` ${warnings}`) : '',
  ].filter(Boolean);
  const summary = groups.join(color(theme, lineColor, ' › '));
  const full = `${summary}${color(theme, lineColor, ' ⟩ ')}${color(theme, 'dim', '/pi-status')}`;
  if (visibleWidth(full) < width) return full;
  if (visibleWidth(summary) < width) return summary;

  const total = errors + warnings;
  const severity = errors > 0 ? 'error' : 'warning';
  const icon = errors > 0 ? '󰅙' : '';
  const count = loud(theme, severity, `${icon} ${total}`);
  return visibleWidth(count) < width ? count : '';
}

function formatGoalElapsed(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes}m ${Math.floor(seconds % 60)}s`;
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return `${Math.floor(tokens)}`;
}

const GOAL_STATUS_COLORS: Record<string, string> = {
  active: 'accent',
  complete: 'success',
  paused: 'warning',
  blocked: 'error',
  usage_limited: 'warning',
  budget_limited: 'warning',
  queued: 'dim',
};

function goalBadgeTile(
  goal: NonNullable<HeaderSelection['goal']>,
  theme: Theme,
): string {
  const semantic = GOAL_STATUS_COLORS[goal.status] ?? 'text';
  const elapsed =
    goal.elapsedSeconds !== undefined
      ? ` · ${formatGoalElapsed(goal.elapsedSeconds)}`
      : '';
  return `${color(theme, semantic, `● ${goal.status}`)}${color(theme, 'dim', elapsed)}`;
}

function goalTreeLines(
  goal: NonNullable<HeaderSelection['goal']>,
  width: number,
  theme: Theme,
): string[] {
  if (width < 56) return [];
  const rows: string[] = [];
  if (goal.tasksTotal !== undefined && goal.tasksDone !== undefined) {
    const active =
      goal.tasksActive !== undefined && goal.tasksActive > 0
        ? ` · ${goal.tasksActive} active`
        : '';
    rows.push(`  ├ tasks ${goal.tasksDone}/${goal.tasksTotal} done${active}`);
  }
  if (goal.tokensUsed !== undefined) {
    const budget =
      goal.tokenBudget !== undefined && goal.tokenBudget > 0
        ? ` · budget ${Math.min(999, Math.round((goal.tokensUsed / goal.tokenBudget) * 100))}%`
        : '';
    rows.push(`  └ usage ${formatTokens(goal.tokensUsed)} tokens${budget}`);
  }
  return rows.map((line) => color(theme, 'dim', line));
}

export function renderHeaderDeck(
  state: HeaderDeckState,
  width: number,
  theme: Theme,
): string[] {
  const boundedWidth = Math.max(0, Math.floor(width));
  if (boundedWidth === 0) return [];

  const lineColor = 'thinkingHigh';
  const solidRule = color(theme, lineColor, '─'.repeat(boundedWidth));
  const dottedRule = `\u001b[2m${color(theme, 'text', '┈'.repeat(boundedWidth))}\u001b[22m`;
  // Line 2 (four-line deck): the clock and Subject lead with Work on the
  // right end; goal progress rows keep their home beneath this line.
  // Narrow frames: the Work slot yields before the clock anchor does.
  const goalDetail =
    state.header?.selection?.source === 'goal'
      ? state.header.selection.goal
      : undefined;
  const titleRight =
    boundedWidth >= 40
      ? goalDetail
        ? goalBadgeTile(goalDetail, theme)
        : workTile(state, theme)
      : '';
  const focusLines = titleBandLines(state, boundedWidth, theme);
  const titleRows = [
    alignedSingleRow(focusLines[0] ?? '', titleRight, boundedWidth),
    ...focusLines.slice(1),
  ];
  const goalRows = goalDetail ? goalTreeLines(goalDetail, boundedWidth, theme) : [];

  // Line 3 (four-line deck): Activity left with the per-turn cost right —
  // the superseded lifecycle/suggestion/runs tiles are gone; Work,
  // Activity, and the spans rows are their replacements. The spans rows
  // keep their home directly beneath this line.
  const activityRow = alignedSingleRow(
    ` ${activityTile(state, theme)}`,
    turnCostTile(state, theme),
    boundedWidth,
  );
  // Line 4 (deck-machine-corner amendment): the engine group holds the
  // row's left end; the right end is notice-only. The machine group moved
  // to the line-1 corner, so notices can no longer starve machine
  // readings — the old wholesale yield is gone with the group itself.
  // 0.7.1 amendment: a clean notice slot renders the dim `healthy`
  // placeholder instead of trailing silence — it yields like a notice
  // when the engine group needs the width.
  const engineGroup = telemetryRowLeft(state, theme);
  const noticeGroup = noticeTile(state, theme);
  const rightGroup = noticeGroup !== '' ? noticeGroup : color(theme, 'dim', 'healthy');
  const telemetryRow =
    visibleWidth(engineGroup) + 1 + visibleWidth(rightGroup) <= boundedWidth
      ? alignedSingleRow(engineGroup, rightGroup, boundedWidth)
      : fit(engineGroup, boundedWidth);

  // Band adjacency (Human-directed, accepted mockups; third 2.4
  // amendment): the deck opens with a full ─ rule directly beneath the
  // line-1 strip and ends at the telemetry row — nothing renders beneath
  // line 4; pi's own prompt chrome below closes the visual block — while
  // the internal seams stay dotted ┈ between lines 2 and 3 and between
  // line 3 (spans rows included) and line 4.
  const corner = deckCornerRight(state, theme, boundedWidth);
  const alert = statusAlertTile(
    state,
    Math.max(0, boundedWidth - visibleWidth(corner) - 2),
    theme,
    lineColor,
  );
  const rows = [
    alignedSingleRow(
      projectDeckLeft(state, theme, boundedWidth),
      alert ? `${alert} ${corner}` : corner,
      boundedWidth,
    ),
    solidRule,
    ...titleRows,
    ...goalRows,
    dottedRule,
    activityRow,
    ...spanTreeRows(state, boundedWidth, theme),
    dottedRule,
    telemetryRow,
  ];
  return rows.map((line) => fitWithoutDanglingSeparator(line, boundedWidth));
}
