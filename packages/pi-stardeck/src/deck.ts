import type { Theme } from '@earendil-works/pi-coding-agent';
import { truncateToWidth, visibleWidth } from '@earendil-works/pi-tui';

import type { LspCapability, McpCapability } from './capabilities.ts';
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
import { deckWorkSegments } from './title-state.ts';

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
  /** Git-style first 8 chars of the Pi session id; worn by the sentinel. */
  sessionShortId?: string;
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

function mirrorKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/gu, '');
}

function titleBandLines(state: HeaderDeckState, width: number, theme: Theme): string[] {
  // Line 2 anchor: the clock always leads the band with its icon; the
  // Subject follows when the title state carries one, and a fresh session
  // (subject null) leaves the clock leading alone — no dangling separator.
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
    // Human amendment 2026-10-23: when the subject mirrors the focused
    // change (the gate law's "subject mirrors its title"), it renders
    // success-green like the PWD — the mirror visible at a glance.
    const work = title.work;
    const mirrorsFocus = work !== null && mirrorKey(subject) === mirrorKey(work.change);
    return focusWrapLines(
      subject,
      clock,
      width,
      theme,
      mirrorsFocus ? 'success' : 'accent',
    );
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
  return deckWorkSegments(work)
    .map((segment) => color(theme, segment.color, segment.text, segment.bold === true))
    .join('');
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
  answering: 'answering',
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
  // `awaiting-*` kinds are the rest face — they never speak for the band
  // (a focused session still retires; quiet-activity-row amendment).
  if (!activity || activity.kind.startsWith('awaiting-')) return '';
  return ACTIVITY_LABELS[activity.kind];
}

/** `editing deck.ts` / `reading schema.yaml` / `subagent: scout`. */
function titleActivityLabel(activity: { class: string; target: string }): string {
  return activity.class === 'subagent'
    ? `subagent: ${activity.target}`
    : `${activity.class} ${activity.target}`;
}

/** The line-3 band speaks when either side carries a real signal:
 * an observed activity (title-state or legacy) or a turn meter that
 * cost tokens or time. Both idle (`awaiting Human` + `— · 0 tok` or
 * no meter) is zero activity — the band and its seam retire
 * (Human-directed 2026-10-20, quiet-activity-row). */
/** Live phase word from the header's kind-based activity projection —
 * fills the gaps between tools (thinking, planning, checking) so the
 * band never claims `awaiting Human` mid-turn. The `awaiting-*` kinds
 * are the REST face (awaiting Human review/input after settle): they
 * never speak for the band, or a focused session would never rest
 * (quiet-activity-row amendment). */
function liveKindLabel(state: HeaderDeckState): string {
  const activity = state.header?.activity ?? null;
  if (!activity || activity.kind.startsWith('awaiting-')) return '';
  return ACTIVITY_LABELS[activity.kind] ?? '';
}

/** The band's current left label: the precise title-state activity when a
 * tool is observed, else the live phase word; empty when truly idle. */
function observedActivityLabel(state: HeaderDeckState): string {
  const title = state.header?.title ?? null;
  if (title) {
    return title.activity ? titleActivityLabel(title.activity) : liveKindLabel(state);
  }
  return activityLabel(state) || liveKindLabel(state);
}

function activityBandSpeaks(state: HeaderDeckState): boolean {
  const activitySpeaks = observedActivityLabel(state) !== '';
  const turn = state.header?.turn ?? null;
  const costSpeaks = turn !== null && (turn.tokens > 0 || turn.elapsedMs > 0);
  return activitySpeaks || costSpeaks;
}

function activityTile(state: HeaderDeckState, theme: Theme): string {
  // Line 3 left: the observed activity owns the slot — the live phase word
  // between tools, `awaiting Human` only when the session truly rests.
  const label = observedActivityLabel(state);
  return label ? color(theme, 'text', label) : color(theme, 'dim', 'awaiting Human');
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

function projectDeckLeft(
  state: HeaderDeckState,
  theme: Theme,
  width: number,
  identity: { text: string; trailingBare: boolean },
): string {
  // Line 1 left (deck-reshape): the identity cluster LEADS —
  // `identity ⟩ path › git` — never the reverse; the cluster never
  // drops, so truncation eats the git segment first, then the path.
  const path = color(theme, 'success', `\u{F07B} ${safeText(state.cwd)}`);
  const gitSegment =
    width >= 79 ? truncateToWidth(gitRight(state, theme), 52, '…') : '';
  const left = gitSegment ? `${path} ${semanticSeparator(theme)} ${gitSegment}` : path;
  return `${identity.text} ${semanticSeparator(theme)} ${left}`;
}

type CompanionSpec = {
  keys: readonly string[];
  icons: readonly string[];
};

// Human icon swap 2026-10-19: every chip is a Nerd Font PUA glyph with
// identical single-cell metrics (verified via font cmap + advance in two
// NF families) — the base-font symbols (↻ ⌬ ⛨) rendered two cells in
// some terminals and no spacing rule could compensate. md-sync keeps
// engram's loop semantics; md-graph reads knowledge-graph; md-shield
// keeps appa's shield — all md- family, matching visual weight.
const KNOWN_COMPANION_ICONS: ReadonlyArray<CompanionSpec> = [
  { keys: ['engram'], icons: ['\u{F04E6}'] },
  { keys: ['graphify'], icons: ['\u{F1049}'] },
  { keys: ['appa', 'openappa'], icons: ['\u{F0498}'] },
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
    if (texts.has(item.key)) continue;
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
  // Uniform single-cell icons: plain single-space join, single gap
  // before the major separator (trailingBare false).
  return { text: parts.join(' '), trailingBare: false };
}

const BLOCKED_NOTICE = '\u26d4 blocked';
const APPROVAL_NOTICE = 'approval required';

/** Narrowest frame that hosts the id-bearing sentinel cluster (12 cells
 * plus breathing room for the machine ladder). */
const SENTINEL_ID_MIN_WIDTH = 24;
const SENTINEL_BUG = '\u{F082D}';

function companionWarningTexts(state: HeaderDeckState): string[] {
  // Same sources as the capability-health chips: the known companions'
  // native-status texts, ranked after blocked/approval.
  const texts = new Map<string, string>();
  for (const item of state.piStatus?.nativeStatuses ?? []) {
    if (texts.has(item.key)) continue;
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
 * (Task 3.1). Ranked per the spec's accepted mixed render: the companion
 * group (blocked, approval, warning texts), then the diagnostics count —
 * `·`-joined, empty when clean.
 */
export function collectDeckNotices(state: HeaderDeckState): string[] {
  const header = state.header;
  const notices: string[] = [];
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

function noticeTile(state: HeaderDeckState, theme: Theme, width: number): string {
  const notices = collectDeckNotices(state);
  // Healthy sentinel (Human-directed 2026-10-19, reversing the retirement):
  // when the ladder is silent the dim ladybug holds the right end — the
  // deck's signature glyph and a reserved one (safeText strips 󰠭 from
  // published text), so the status row always speaks: ⚠ with notices,
  // the quiet ladybug when all is well. Ladybug-session-id amendment
  // (Human-directed 2026-10-20): a clean frame with a known session id
  // wears it between two ladybugs — blue bugs, purple id — so the deck
  // doubles as a track-and-restore handle; the plain dim bug stays when
  // the id is unknown or the frame is too narrow for the cluster.
  if (notices.length === 0) {
    const id = state.sessionShortId;
    if (id !== undefined && width >= SENTINEL_ID_MIN_WIDTH) {
      return `${color(theme, 'accent', SENTINEL_BUG)} ${color(theme, 'thinkingHigh', id)} ${color(theme, 'accent', SENTINEL_BUG)}`;
    }
    return color(theme, 'dim', SENTINEL_BUG);
  }
  // Blocked carries the error severity it wore on the deleted lifecycle
  // tile; every other notice renders at warning.
  const semantic = notices.includes(BLOCKED_NOTICE) ? 'error' : 'warning';
  return color(theme, semantic, `\u26a0 ${notices.join(' · ')}`);
}

export function machineCornerSegments(
  state: HeaderDeckState,
  theme: Theme,
  nowMs = Date.now(),
): string[][] {
  // Machine tail (deck-machine-corner; deck-corner-context; swap
  // amendment): GROUPED icon-led readings — quota (flame + countdown),
  // process (cpu › mem › mcp), context (ctx › sums), cost — minor
  // separators inside a group, big separators between groups; groups
  // yield right-to-left on narrow frames.
  const quotaGroup: string[] = [];
  const flame = windowQuotaTiles(state, theme, nowMs);
  if (flame !== '') quotaGroup.push(flame);
  const processGroup: string[] = [];
  const resources = state.resources;
  if (resources) {
    const resourceColor =
      resources.cpuWarning || resources.memoryWarning ? 'warning' : 'accent';
    processGroup.push(
      color(theme, resourceColor, `\u{F035B} ${formatDeckCpu(resources.cpuPercent)}`),
    );
    processGroup.push(
      color(
        theme,
        resourceColor,
        `\u{F061A} ${formatDeckBytes(resources.memoryBytes)}`,
      ),
    );
  }
  if (state.mcp) {
    processGroup.push(
      color(theme, 'accent', `${state.mcp.healthy}/${state.mcp.total}`),
    );
  }
  const contextGroup: string[] = [];
  // deck-corner-context: context and summary counts ride together.
  // Context wears warning at ≥ 85% (the threshold it carried engine-left);
  // the summary count follows the context color as before.
  const ctxColor =
    state.contextPercent !== undefined && state.contextPercent >= 85
      ? 'warning'
      : state.contextPercent === undefined
        ? 'dim'
        : 'accent';
  if (state.contextPercent !== undefined) {
    contextGroup.push(
      color(theme, ctxColor, `\u{F0F86} ${formatDeckPercent(state.contextPercent)}`),
    );
  }
  if (state.compactionCount > 0) {
    contextGroup.push(color(theme, ctxColor, `\u{F039E} ${state.compactionCount}`));
  }
  const costGroup: string[] = [];
  const cost = costTile(state, theme);
  if (cost !== '') costGroup.push(cost);
  return [quotaGroup, processGroup, contextGroup, costGroup].filter(
    (group) => group.length > 0,
  );
}

function deckCornerRight(state: HeaderDeckState, theme: Theme, width: number): string {
  // Line 1 right corner (deck-reshape, swap amendment): the ENGINE
  // group — short and predictable (`󰚩 model › thinking › 󰃰 weekly?`) —
  // so a growing PWD/branch never fights the long machine tail for
  // width. It fits beside the path floor or yields wholesale. The
  // machine tail lives on the bottom row now; the identity cluster
  // leads line 1 LEFT and never yields.
  const engine = modelGroupLeft(state, theme);
  if (engine === '') return '';
  return width - visibleWidth(engine) - 1 >= 20 ? engine : '';
}

function machineCornerLadder(
  state: HeaderDeckState,
  theme: Theme,
  width: number,
  nowMs = Date.now(),
): string {
  // Bottom row left (deck-reshape, swap amendment): the machine tail
  // yields right-to-left (cost first) into whatever width remains
  // beside the status right end.
  const groups = machineCornerSegments(state, theme, nowMs);
  for (let keep = groups.length; keep >= 1; keep -= 1) {
    const tail = groups
      .slice(0, keep)
      .map((group) => group.join(` ${minorSeparator(theme)} `))
      .join(` ${semanticSeparator(theme)} `);
    if (visibleWidth(tail) <= width) return tail;
  }
  return '';
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
    `󰃰 ${calendar.label} ${formatDeckPercent(calendar.percent)}`,
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

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return `${Math.floor(tokens)}`;
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
  // right end. Narrow frames: the Work slot yields before the clock anchor
  // does.
  const titleRight = boundedWidth >= 40 ? workTile(state, theme) : '';
  const focusLines = titleBandLines(state, boundedWidth, theme);
  const titleRows = [
    alignedSingleRow(focusLines[0] ?? '', titleRight, boundedWidth),
    ...focusLines.slice(1),
  ];

  // Line 3 (four-line deck): Activity left with the per-turn cost right —
  // the superseded lifecycle/suggestion/runs tiles are gone; Work,
  // Activity, and the spans rows are their replacements. The spans rows
  // keep their home directly beneath this line.
  const spanRows = spanTreeRows(state, boundedWidth, theme);
  const bandSpeaks = activityBandSpeaks(state);
  const activityRow = bandSpeaks
    ? alignedSingleRow(
        activityTile(state, theme),
        turnCostTile(state, theme),
        boundedWidth,
      )
    : '';
  // deck-reshape, swap amendment: the bottom row carries the MACHINE
  // tail on the left (yielding right-to-left into whatever width the
  // status leaves) and the status on the right — which always speaks
  // now: ⚠ notices or the dim ladybug sentinel when clean. The engine
  // group moved to line 1 right.
  const statusRight = noticeTile(state, theme, boundedWidth);
  const machineRow = machineCornerLadder(
    state,
    theme,
    statusRight === '' ? boundedWidth : boundedWidth - visibleWidth(statusRight) - 1,
  );
  const engineRow =
    statusRight === '' && machineRow === ''
      ? ''
      : alignedSingleRow(machineRow, statusRight, boundedWidth);

  // Band adjacency (Human-directed, accepted mockups; third 2.4
  // amendment): the deck opens with a full ─ rule directly beneath the
  // line-1 strip; the internal seams stay dotted ┈ between lines 2 and
  // 3 and between line 3 (spans rows included) and the status row —
  // except the 2/3 seam retires with a silent, spanless line-3 band
  // (quiet-activity-row): idle + zero cost never narrates itself.
  const identity = identityCluster(state, theme);
  const corner = deckCornerRight(state, theme, boundedWidth);
  const alert = statusAlertTile(
    state,
    Math.max(0, boundedWidth - visibleWidth(corner) - 2),
    theme,
    lineColor,
  );
  const rows = [
    alignedSingleRow(
      projectDeckLeft(state, theme, boundedWidth, identity),
      alert ? `${alert} ${corner}` : corner,
      boundedWidth,
    ),
    solidRule,
    ...titleRows,
    ...(bandSpeaks || spanRows.length > 0 ? [dottedRule] : []),
    ...(bandSpeaks ? [activityRow] : []),
    ...spanRows,
    ...(engineRow.trim() !== '' ? [dottedRule, engineRow] : []),
  ];
  return rows.map((line) => fitWithoutDanglingSeparator(line, boundedWidth));
}
