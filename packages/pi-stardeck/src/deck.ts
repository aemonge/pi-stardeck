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
    if (!subject) return [clock];
    return focusWrapLines(subject, clock, width, theme, 'accent');
  }
  // Pre-title publishers: the legacy selection keeps the band alive.
  const selection = state.header?.selection;
  const titles = (selection?.titles ?? [])
    .map((value) => safeText(value))
    .filter(Boolean);
  if (!selection || titles.length === 0) {
    return [clock]; // frozen contract: no selection means no slot, clock stays
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
  // Line 1 left: the devbox marker is a path prefix, then the path; the git
  // segment yields below 79 columns before the path does. The companion
  // chips ride line 1's right end and never drop (always-visible contract).
  const devbox = state.devbox ? `${color(theme, 'success', '[󰆧]', true)} ` : '';
  const path = `${devbox}${color(theme, 'success', ` ${safeText(state.cwd)}`)}`;
  const gitSegment =
    width >= 79 ? truncateToWidth(gitRight(state, theme), 52, '…') : '';
  return gitSegment ? `${path} ${semanticSeparator(theme)} ${gitSegment}` : path;
}

const KNOWN_COMPANION_ICONS: ReadonlyArray<{
  keys: readonly string[];
  icons: readonly string[];
}> = [
  { keys: ['engram'], icons: ['\u{21BB}', '\u{25A4}'] },
  { keys: ['graphify'], icons: ['\u{232C}'] },
  { keys: ['appa', 'openappa'], icons: ['\u{26E8}'] },
];

const COMPANION_WARNING_PATTERN =
  /(warn|error|stale|unreachable|down|fail|update recommended|needs attention|unhealthy)/iu;

function companionIconColor(text: string | undefined, active: boolean): string {
  // Color is the only state signal: symbols never hide.
  // On = accent, warn/error = warning, off = muted (visible gray).
  if (!active) return 'muted';
  return text !== undefined && COMPANION_WARNING_PATTERN.test(text)
    ? 'warning'
    : 'accent';
}

function extensionStatusCodes(state: HeaderDeckState, theme: Theme): string {
  const texts = new Map<string, string>();
  for (const item of state.piStatus?.nativeStatuses ?? []) {
    if (item.key === 'goal' || texts.has(item.key)) continue;
    texts.set(item.key, item.text);
  }
  const parts: Array<{ bare: boolean; text: string }> = [];
  for (const companion of KNOWN_COMPANION_ICONS) {
    const published = companion.keys
      .map((key) => texts.get(key))
      .find((text) => text !== undefined);
    for (const key of companion.keys) texts.delete(key);
    const joined = companion.icons.join(' ');
    const chip = companion.icons.length > 1 ? `[${joined}]` : joined;
    parts.push({
      bare: companion.icons.length === 1,
      text: color(
        theme,
        companionIconColor(published, published !== undefined),
        chip,
        true,
      ),
    });
  }
  let out = '';
  let previousBare = false;
  for (const part of parts) {
    out +=
      out === '' ? part.text : `${previousBare && part.bare ? '  ' : ' '}${part.text}`;
    previousBare = part.bare;
  }
  return out;
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
    if (published !== undefined && COMPANION_WARNING_PATTERN.test(published)) {
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
  return notices;
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
  // Line 4 left (2.4 second amendment): the engine group — engine ›
  // thinking, then context, compaction, and the calendar quota — owns
  // the row's left end; the notice slot owns the right end (Task 3).
  return modelGroupLeft(state, theme);
}

function telemetryRowRight(
  state: HeaderDeckState,
  theme: Theme,
  nowMs = Date.now(),
): string {
  // Line 4 right (2.4 second amendment): the machine group — the coding
  // quota flame with its countdown, machine readings, global cost — in
  // that order, anchoring the row's right end.
  const machineSegments: string[] = [];
  const resources = state.resources;
  if (resources) {
    const resourceColor =
      resources.cpuWarning || resources.memoryWarning ? 'warning' : 'accent';
    const parts = [
      color(theme, resourceColor, `${formatDeckCpu(resources.cpuPercent)}`),
      color(theme, resourceColor, `${formatDeckBytes(resources.memoryBytes)}`),
    ];
    machineSegments.push(parts.join(` ${minorSeparator(theme, resourceColor)} `));
  }
  if (state.mcp) {
    machineSegments.push(
      color(theme, 'accent', `${state.mcp.healthy}/${state.mcp.total}`),
    );
  }
  return [
    windowQuotaTiles(state, theme, nowMs),
    machineSegments.join(` ${semanticSeparator(theme)} `),
    costTile(state, theme),
  ]
    .filter((group) => group !== '')
    .join(` ${semanticSeparator(theme)} `);
}

function modelGroupLeft(state: HeaderDeckState, theme: Theme): string {
  const ctxColor =
    state.contextPercent !== undefined && state.contextPercent >= 85
      ? 'warning'
      : state.contextPercent === undefined
        ? 'dim'
        : 'accent';
  const segments: string[] = [];
  if (state.contextPercent !== undefined) {
    segments.push(
      color(theme, 'accent', `󰾆 ${formatDeckPercent(state.contextPercent)}`),
    );
  }
  if (state.compactionCount > 0) {
    segments.push(color(theme, ctxColor, `󰎞 ${state.compactionCount}`));
  }
  const quota = simpleQuotaTile(state, theme);
  if (quota) segments.push(quota);
  return segments.length === 0
    ? globalLeft(state, theme)
    : [
        globalLeft(state, theme),
        semanticSeparator(theme),
        segments.join(` ${minorSeparator(theme, ctxColor)} `),
      ].join(' ');
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
  // Line 4 (2.4 second amendment + Task 3 placement default): the engine
  // group holds the row's left end. Its right end belongs to the machine
  // group — until notices land: a non-empty notice slot owns the right end
  // and the machine group yields wholesale, riding the same ladder as the
  // narrow-frame yield (the right group renders only when it fits beside
  // the engine group at full width; the engine group never yields to it).
  const engineGroup = telemetryRowLeft(state, theme);
  const noticeGroup = noticeTile(state, theme);
  const rightGroup = noticeGroup !== '' ? noticeGroup : telemetryRowRight(state, theme);
  const telemetryRow =
    rightGroup !== '' &&
    visibleWidth(engineGroup) + 1 + visibleWidth(rightGroup) <= boundedWidth
      ? alignedSingleRow(engineGroup, rightGroup, boundedWidth)
      : fit(engineGroup, boundedWidth);

  // Band adjacency (Human-directed, accepted mockups; third 2.4
  // amendment): the deck opens with a full ─ rule directly beneath the
  // line-1 strip and ends at the telemetry row — nothing renders beneath
  // line 4; pi's own prompt chrome below closes the visual block — while
  // the internal seams stay dotted ┈ between lines 2 and 3 and between
  // line 3 (spans rows included) and line 4.
  const chips = extensionStatusCodes(state, theme);
  const alert = statusAlertTile(
    state,
    Math.max(0, boundedWidth - visibleWidth(chips) - 2),
    theme,
    lineColor,
  );
  const rows = [
    alignedSingleRow(
      projectDeckLeft(state, theme, boundedWidth),
      alert ? `${alert} ${chips}` : chips,
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
