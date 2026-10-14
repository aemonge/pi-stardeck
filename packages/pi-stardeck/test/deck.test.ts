import assert from 'node:assert/strict';
import test from 'node:test';
import { visibleWidth } from '@earendil-works/pi-tui';

import {
  formatDeckElapsed,
  renderHeaderDeck,
  type HeaderDeckState,
} from '../src/deck.ts';
import { parseDeckTitleState } from '../src/title-state.ts';

const plainTheme = {
  fg: (_color: string, text: string) => text,
  bold: (text: string) => text,
};

function plain(text: string): string {
  return text.replace(/\u001b\[[0-?]*[ -/]*[@-~]/gu, '');
}

function fixture(): HeaderDeckState {
  return {
    elapsedMs: 7_000,
    header: {
      activity: null,
      work: {
        lifecycle: 'waiting',
        titles: [
          'Read-only preflight for the interrupted one-line Review ledger fix',
          'before further OpenSpec validation and implementation',
        ],
        color: 'accent',
      },
      selection: {
        source: 'openspec',
        titles: [
          'Read-only preflight for the interrupted one-line Review ledger fix',
          'before further OpenSpec validation and implementation',
        ],
        color: 'accent',
      },
      suggestion: 'requesting-validation',
      diagnostics: null,
      backgroundActivity: false,
      approvalRequired: true,
      blocked: false,
      counters: {
        agents: { active: 0, total: 0 },
        activeRuns: { children: 2, subagents: 1 },
        tasks: { completed: 0, total: 1 },
        steps: { completed: 6, total: 16 },
        files: { completed: 37, total: 53 },
      },
      progress: [],
    },
    cwd: '~/galactica',
    devbox: true,
    branch: 'feature/review-ledger/preserve-openspec-validation',
    gitAvailable: true,
    git: { staged: 2, modified: 3, untracked: 1, conflicts: 0 },
    model: 'GPT-5.6 Sol',
    thinking: 'high',
    contextPercent: 38,
    contextTokens: 32 * 1024,
    contextWindow: 128 * 1024,
    compactionCount: 2,
    resources: {
      cpuPercent: 48.2,
      memoryBytes: 268 * 1024 * 1024,
      cpuWarning: false,
      memoryWarning: false,
    },
    footerTelemetry: { totalCost: 5.16, quotaPercent: 63 },
    lsp: { healthy: 2, total: 2 },
    mcp: { healthy: 3, total: 3 },
    mode: 'normal',
  };
}

test('formats fixed-width minute activity age with visible hundredths', () => {
  assert.equal(formatDeckElapsed(null), "000:00'00");
  assert.equal(formatDeckElapsed(54), "000:00'05");
  assert.equal(formatDeckElapsed(999), "000:00'99");
  assert.equal(formatDeckElapsed(1_000), "000:01'00");
  assert.equal(formatDeckElapsed(62_345), "001:02'34");
  assert.equal(formatDeckElapsed(3_600_000), "060:00'00");
  assert.equal(formatDeckElapsed(Number.POSITIVE_INFINITY), "999:59'99");
  assert.equal(formatDeckElapsed(Number.NaN), "000:00'00");
  assert.equal(formatDeckElapsed(Number.NEGATIVE_INFINITY), "000:00'00");
});

test('renders the approved rich wide header without side borders or spacer rows', () => {
  const lines = renderHeaderDeck(fixture(), 160, plainTheme as never);

  assert.equal(lines.length, 5);
  const titleRow = plain(lines[2] ?? '');
  assert.ok(titleRow.startsWith("󰠭 000:07'00 ⟩ Read-only preflight"));
  assert.ok(titleRow.includes("000:07'00"));
  assert.match(lines[1] ?? '', /^─+$/u);
  const statusRow = plain(lines[4] ?? '');
  assert.ok(statusRow.includes('waiting'));
  assert.ok(statusRow.includes('requesting validation or redirection'));
  // Counter removal lockstep: Work owns line 2's right end — the task/stps
  // tiles never render there again (accepted mockups supersede them).
  assert.equal(titleRow.includes('task 0/1'), false);
  assert.equal(titleRow.includes('stps 6/16'), false);
  assert.equal(statusRow.includes('idle'), false);
  assert.match(statusRow, /^. 02 › . 01 ⟩ waiting/u);
  assert.doesNotMatch(lines[4] ?? '', /requesting validation or redirection ⟩  task/u);
  assert.equal(plain(lines[3] ?? ''), '┈'.repeat(160));
  assert.match(lines[3] ?? '', /^\u001b\[2m/u);
  assert.match(
    plain(lines[0] ?? ''),
    /^\[.\] \[\u{21BB} \u{25A4}\] \u{232C}  \u{26E8}  \u{203A} [\u{E000}-\u{F8FF}] ~\/galactica ⟩/u,
  );
  assert.match(plain(lines[0] ?? ''), /feature\/review-led/u);
  assert.ok(statusRow.includes('GPT-5.6 Sol'));
  assert.ok(statusRow.trimEnd().endsWith('63%'));
  assert.match(
    lines[4] ?? '',
    /\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F0F86} 38% \u{203A} \u{F039E} 2 \u{203A} \u{F241} 63%$/u,
  );
  assert.match(
    lines[0] ?? '',
    /48\.2% \u{203A} 268M \u{27E9} 3\/3 \u{27E9} \u{F0726} \$5\.16$/u,
  );
  assert.equal(lines.join('\n').includes('32K/128K'), false);
  assert.ok(lines.every((line) => line.length > 0));
  assert.ok(lines.every((line) => !line.startsWith('│') && !line.endsWith('│')));
  assert.equal(lines.join('').split('󰠭').length - 1, 1);
  assert.equal(lines.join('').includes('󰒋 LSP'), false);
});

test('turns the top ladybug into distinct error and warning counts', () => {
  const state = fixture();
  state.piStatus = { errors: 2, warnings: 3, nativeStatusCount: 0 };

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  const alert = lines.find((line) => plain(line).startsWith('─ 󰅙')) ?? '';
  assert.match(plain(alert), /^─ 󰅙 2 ›  3 ⟩ \/pi-status ─+$/u);
  assert.equal(alert.split('⟩').length - 1, 1);
  assert.doesNotMatch(alert, /󰠭/u);
  assert.ok(alert.includes('\u001b[7m'));

  const colors: string[] = [];
  renderHeaderDeck(state, 160, {
    fg: (name: string, text: string) => {
      colors.push(`${name}:${text}`);
      return text;
    },
    bold: (text: string) => text,
  } as never);
  assert.ok(colors.includes('error:󰅙 2'));
  assert.ok(colors.includes('warning: 3'));
  assert.ok(colors.includes('dim:/pi-status'));
});

test('drops the footer count; diagnostics stay on the top rule', () => {
  const state = fixture();
  state.piStatus = { errors: 0, warnings: 0, nativeStatusCount: 3 };

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  assert.match(lines[1] ?? '', /^─+$/u);
  assert.equal(lines.join('').includes('·3'), false);
  // Relocation phase: the footer count is deleted; the anchor echo remains.
  assert.doesNotMatch(lines.at(-1) ?? '', /[0-9] ‹/u);

  const ansiTheme = {
    fg: (_semanticColor: string, text: string) => `\u001b[35m${text}\u001b[0m`,
    bold: (text: string) => `\u001b[1m${text}\u001b[22m`,
  };
  const wrapped = renderHeaderDeck(state, 59, ansiTheme as never);
  assert.ok(wrapped.every((line) => visibleWidth(line) <= 59));
  const wrappedTop = wrapped.find((line) => /^─+$/u.test(plain(line))) ?? '';
  assert.match(plain(wrappedTop), /^─+$/u);

  state.piStatus.nativeStatusCount = 0;
  const empty = renderHeaderDeck(state, 160, plainTheme as never);
  assert.doesNotMatch(empty[1] ?? '', /·0/u);
});

test('unfocused open goals ride the title row as an inline hint', () => {
  const state = fixture();
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    openGoals: 1,
  };

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const titleRow = lines.find((line) => line.includes("000:07'00")) ?? '';
  assert.match(titleRow, /000:07'00 ⟩ \(1 open goal · \/goal-focus\)/u);
  assert.equal(
    lines.some((line) => /^◆ /u.test(line)),
    false,
  );
});

test('goal selection owns the title row with badge and tree rows', () => {
  const state = fixture();
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    selection: {
      source: 'goal',
      titles: ['Ship the chrome-only cockpit'],
      color: 'accent',
      goal: {
        status: 'paused',
        elapsedSeconds: 195,
        tasksDone: 1,
        tasksActive: 1,
        tasksTotal: 3,
        tokensUsed: 363_500,
        tokenBudget: 600_000,
      },
    },
  };

  const lines = renderHeaderDeck(state, 100, plainTheme as never).map(plain);
  const titleRow =
    lines.find((line) => line.includes('Ship the chrome-only cockpit')) ?? '';
  assert.match(titleRow, /Ship the chrome-only cockpit.*● paused · 3m 15s/u);
  assert.ok(lines.some((line) => /├ tasks 1\/3 done · 1 active/u.test(line)));
  assert.ok(lines.some((line) => /└ usage 363\.5k tokens · budget 61%/u.test(line)));

  const narrow = renderHeaderDeck(state, 50, plainTheme as never).map(plain);
  assert.equal(
    narrow.some((line) => line.includes('tasks 1/3')),
    false,
  );
  const narrowTitle = narrow.find((line) => line.includes('Ship the chrome')) ?? '';
  assert.match(narrowTitle, /● paused/u);
});

test('extension statuses ride the telemetry tail as icons', () => {
  const state = fixture();
  state.piStatus = {
    errors: 0,
    warnings: 0,
    nativeStatusCount: 2,
    nativeStatuses: [
      { key: 'engram', text: '\u{1F9E0} pi-vimux-starship · ready' },
      { key: 'graphify', text: 'graphify active · report available' },
    ],
  };

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const telemetry = lines[0] ?? '';
  assert.match(
    telemetry,
    /^\[.\] \[\u{21BB} \u{25A4}\] \u{232C}  \u{26E8}  \u{203A} [\u{E000}-\u{F8FF}] ~/u,
  );
  assert.ok(telemetry.indexOf('~/') > telemetry.indexOf('\u{F08BE}'));
  assert.equal(telemetry.includes('engram'), false);
  assert.equal(telemetry.includes('graphify'), false);
  assert.equal(
    lines.some((line) => /^┈+ /u.test(line) && line.includes('engram')),
    false,
    'footnote row is gone',
  );
});

test('companion icon colors encode health severity', () => {
  const seen: Array<{ color: string; text: string }> = [];
  const spyTheme = {
    fg: (semantic: string, text: string) => {
      seen.push({ color: semantic, text });
      return text;
    },
    bold: (text: string) => text,
  } as never;
  const state = fixture();
  state.piStatus = {
    errors: 0,
    warnings: 0,
    nativeStatusCount: 2,
    nativeStatuses: [
      { key: 'engram', text: 'ready' },
      { key: 'graphify', text: 'graphify active · update recommended' },
    ],
  };

  renderHeaderDeck(state, 120, spyTheme);
  const brain = seen.find((entry) => entry.text === '[\u{21BB} \u{25A4}]');
  const graph = seen.find((entry) => entry.text === '\u{232C}');
  const shield = seen.find((entry) => entry.text === '\u{26E8}');
  assert.equal(brain?.color, 'accent');
  assert.equal(graph?.color, 'warning');
  assert.equal(shield?.color, 'muted');
});

test('known companion icons are always present', () => {
  const bare = renderHeaderDeck(fixture(), 120, plainTheme as never).map(plain);
  assert.match(bare[0] ?? '', /\[\u{21BB} \u{25A4}\] \u{232C}  \u{26E8}/u);
});

test('extension status icons drop on narrow frames and filter the goal key', () => {
  const state = fixture();
  state.piStatus = {
    errors: 0,
    warnings: 0,
    nativeStatusCount: 2,
    nativeStatuses: [
      { key: 'engram', text: 'ready' },
      { key: 'goal', text: 'unfocused [1 open] - /goal-focus' },
    ],
  };
  const narrow = renderHeaderDeck(state, 60, plainTheme as never).map(plain);
  assert.match(narrow[0] ?? '', /\u{232C}/u);
  assert.equal(
    narrow.some((line) => line.includes('/goal-focus')),
    false,
  );
});

test('drops the status command before severity counts at narrow widths', () => {
  const state = fixture();
  state.piStatus = { errors: 2, warnings: 3, nativeStatusCount: 0 };

  const compact =
    renderHeaderDeck(state, 20, plainTheme as never).find((line) =>
      plain(line).startsWith('─ 󰅙'),
    ) ?? '';
  assert.match(plain(compact), /^─ 󰅙 2 ›  3 /u);
  assert.doesNotMatch(compact, /pi-status/u);

  const narrow =
    renderHeaderDeck(state, 9, plainTheme as never).find((line) =>
      plain(line).startsWith('─ 󰅙'),
    ) ?? '';
  assert.match(plain(narrow), /^─ 󰅙 5/u);
  assert.ok(visibleWidth(narrow) <= 9);
});

test('keeps activity and focus distinct on the title row', () => {
  const state = fixture();
  state.header!.work = {
    lifecycle: 'assuring',
    titles: ['Plan title', 'Current task'],
    color: 'accent',
    activityPath: [{ id: 'verification', label: 'Running checks', compact: 'verify' }],
  };
  state.header!.selection = {
    source: 'openspec',
    titles: ['Plan title', 'Current task'],
    color: 'accent',
  };
  state.header!.suggestion = 'requesting-validation';

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  const statusRow = plain(lines[4] ?? '');
  assert.ok(statusRow.includes('assuring'));
  assert.ok(statusRow.includes('verify'));
  assert.ok(statusRow.includes('requesting validation or redirection'));
  const titleRow = plain(lines[2] ?? '');
  assert.ok(titleRow.startsWith("󰠭 000:07'00 ⟩ Plan title › Current task"));
  assert.ok(titleRow.includes("000:07'00"));
  assert.equal(lines.join('\n').split('Running checks').length - 1, 0);
});

test('gives the complete selected scope a bounded full-width focus canvas', () => {
  const state = fixture();
  const expected =
    'Deliver one deliberately long current Task description that needs a second responsive line without repeating its parent Plan title';
  state.header!.work!.titles = ['Parent Plan title', expected];
  state.header!.selection = {
    source: 'openspec',
    titles: ['Parent Plan title', expected],
    color: 'accent',
  };

  const wide = renderHeaderDeck(state, 160, plainTheme as never);
  assert.doesNotMatch(wide[4] ?? '', /Parent Plan title/u);
  const titleRow = plain(wide[2] ?? '');
  assert.ok(
    titleRow.startsWith(`󰠭 000:07'00 ⟩ Parent Plan title › ${expected}`.slice(0, 40)),
  );
  assert.ok(titleRow.includes("000:07'00"));

  const narrow = renderHeaderDeck(state, 79, plainTheme as never);
  const focusIdx = narrow.findIndex((line) => plain(line).includes("000:07'00"));
  assert.ok(focusIdx >= 0);
  const status = narrow.find((line) => plain(line).includes('waiting')) ?? '';
  assert.ok(status.includes('waiting'));
  assert.equal(status.includes('idle'), false);
  const focus = narrow.slice(focusIdx, focusIdx + 2);
  assert.equal(focus.length, 2);
  assert.ok(plain(focus[0] ?? '').startsWith("󰠭 000:07'00 ⟩ Parent Plan title"));
  assert.ok(plain(focus[1] ?? '').includes('without repeating'));
});

test('keeps a single selected title on the focus row only', () => {
  const state = fixture();
  state.header!.work!.titles = ['One focused work title'];
  state.header!.selection = {
    source: 'session-work',
    titles: ['One focused work title'],
    color: 'accent',
  };

  const wide = renderHeaderDeck(state, 160, plainTheme as never);
  assert.doesNotMatch(wide[4] ?? '', /One focused work title/u);
  const titleRow = plain(wide[2] ?? '');
  assert.ok(titleRow.startsWith("󰠭 000:07'00 ⟩ One focused work title"));
  assert.ok(titleRow.includes("000:07'00"));
  assert.equal(wide.join('\n').split('One focused work title').length - 1, 1);

  const narrow = renderHeaderDeck(state, 79, plainTheme as never);
  assert.ok(
    plain(narrow.find((line) => plain(line).includes("000:07'00")) ?? '').startsWith(
      "󰠭 000:07'00 ⟩ One focused work title",
    ),
  );
});

test('renders the subject selection on the focus row instead of an em dash', () => {
  const state = fixture();
  state.header!.work = null;
  state.header!.selection = {
    source: 'subject',
    titles: ['Session subject'],
    color: 'accent',
  };

  const wide = renderHeaderDeck(state, 160, plainTheme as never);
  const subjectRow = plain(wide[2] ?? '');
  assert.ok(subjectRow.startsWith("󰠭 000:07'00 ⟩ Session subject"));
  assert.ok(subjectRow.includes("000:07'00"));
  assert.doesNotMatch(wide.join('\n'), /󰠭 ⟩ —/u);

  const narrow = renderHeaderDeck(state, 79, plainTheme as never);
  assert.notEqual(plain(narrow[2] ?? ''), `󰠭 ⟩ —`);
});

test('bolds only current control and status anchors', () => {
  const bolded: string[] = [];
  const theme = {
    fg: (_semanticColor: string, text: string) => text,
    bold: (text: string) => {
      bolded.push(text);
      return text;
    },
  };

  renderHeaderDeck(fixture(), 160, theme as never);

  assert.ok(bolded.includes('waiting'));
  assert.ok(bolded.includes('[󰆧]'));
  assert.ok(bolded.includes('⟩'));
  for (const regular of [
    "( 2 ›  1 · 000:07'00)",
    'idle',
    'requesting validation or redirection',
    'Read-only preflight for the interrupted one-line Review ledger fix',
    'before further OpenSpec validation and implementation',
    ' ~/galactica',
    ' feature/review-ledger/preserve-openspec-validation',
    'GPT-5.6 Sol',
  ]) {
    assert.equal(bolded.includes(regular), false, regular);
  }
});

test('uses a bold blue lifecycle with neutral activity and green direction', () => {
  const state = fixture();
  state.header!.work = {
    lifecycle: 'assuring',
    titles: ['Plan title', 'Current task'],
    color: 'accent',
    activityPath: [{ id: 'verification', label: 'Running checks', compact: 'verify' }],
  };
  state.header!.selection = {
    source: 'openspec',
    titles: ['Plan title', 'Current task'],
    color: 'accent',
  };
  state.header!.suggestion = 'requesting-validation';
  state.header!.approvalRequired = false;
  const colors: string[] = [];
  const theme = {
    fg: (semanticColor: string, text: string) => {
      colors.push(`${semanticColor}:${plain(text)}`);
      return text;
    },
    bold: (text: string) => text,
  };

  renderHeaderDeck(state, 160, theme as never);

  assert.ok(colors.includes('accent:assuring'));
  assert.ok(colors.includes('text:verify'));
  assert.ok(colors.includes('warning:requesting validation or redirection'));
  assert.ok(colors.includes('accent:Plan title › Current task'));
  assert.equal(colors.includes('accent:verify'), false);
  assert.equal(colors.includes('accent:requesting validation or redirection'), false);
});

test('colors recovery activity and direction blue while only lifecycle stays bold', () => {
  const state = fixture();
  state.header!.work = {
    lifecycle: 'working',
    titles: ['Repair runtime state'],
    color: 'accent',
    activity: { kind: 'recovery' },
  };
  state.header!.selection = {
    source: 'session-work',
    titles: ['Repair runtime state'],
    color: 'accent',
  };
  state.header!.suggestion = 'awaiting-resume';
  state.header!.approvalRequired = false;
  const colors: string[] = [];
  const bolded: string[] = [];
  const theme = {
    fg: (semanticColor: string, text: string) => {
      colors.push(`${semanticColor}:${plain(text)}`);
      return text;
    },
    bold: (text: string) => {
      bolded.push(text);
      return text;
    },
  };

  const lines = renderHeaderDeck(state, 160, theme as never);

  assert.ok(plain(lines[4] ?? '').includes('working › recovering'));
  assert.ok(plain(lines[4] ?? '').includes('awaiting resume or redirect'));
  assert.ok(colors.includes('accent:recovering'));
  assert.ok(colors.includes('accent:awaiting resume or redirect'));
  assert.ok(bolded.includes('working'));
  assert.equal(bolded.includes('recovering'), false);
  assert.equal(bolded.includes('awaiting resume or redirect'), false);
});

test('reports the WHAT with task title and step while active without a cue', () => {
  const state = fixture();
  state.header!.work = {
    lifecycle: 'working',
    titles: ['Plan title', 'Current task'],
    color: 'accent',
    activity: { kind: 'implementation' },
  };
  state.header!.selection = null;
  state.header!.suggestion = null;
  state.header!.approvalRequired = false;
  state.header!.blocked = false;

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  // Relocation: the capsule keeps a title row alive even without selection.
  const status = plain(lines[4] ?? '');

  assert.ok(status.includes('working › implementing ⟩ Plan title'));
  assert.equal(status.includes('step 7/16'), false);
  assert.equal(plain(lines[2] ?? '').includes('stps 6/16'), false);
  assert.equal(status.includes('󰁕 Plan title'), false);
});

test('silences the what when the selection band already shows it', () => {
  const state = fixture();
  const echoTitle = 'Git joins the project crown; model telemetry rides the row';
  state.header!.work = {
    lifecycle: 'working',
    titles: [echoTitle],
    color: 'accent',
    activity: { kind: 'implementation' },
  };
  state.header!.selection = {
    source: 'session-work',
    titles: [echoTitle],
    color: 'accent',
  };
  state.header!.suggestion = null;

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  const titleLine = plain(lines.find((line) => line.includes("000:07'00")) ?? '');
  const statusLine = plain(lines[4] ?? '');
  assert.ok(titleLine.includes(echoTitle), 'selection band shows the title');
  assert.ok(statusLine.includes('working › implementing'), 'stage stays');
  // No-echo contract: the title renders exactly once across the whole deck.
  assert.equal(lines.join('\n').split(echoTitle).length - 1, 1);
});

test('keeps lifecycle contextual and colors progress by completion', () => {
  const state = fixture();
  state.header!.work!.color = 'warning';
  const colors: string[] = [];
  const theme = {
    fg: (semanticColor: string, text: string) => {
      colors.push(`${semanticColor}:${plain(text)}`);
      return text;
    },
    bold: (text: string) => text,
  };

  renderHeaderDeck(state, 160, theme as never);

  assert.ok(colors.includes('warning:waiting'));
  assert.ok(colors.includes("accent:000:07'00"));
  assert.ok(!colors.some((entry) => entry.endsWith(':idle')));
  assert.ok(colors.includes('warning:requesting validation or redirection'));
  assert.ok(
    colors.includes(
      'accent:Read-only preflight for the interrupted one-line Review ledger fix › before further OpenSpec validation and implementation',
    ),
  );
  // Counter removal lockstep: task/stps tiles are gone in every counter
  // state — Work is their replacement on line 2's right end.
  assert.ok(
    !colors.some((entry) => entry.includes('task 0/1') || entry.includes('stps 6/16')),
  );
  state.header!.counters.tasks = { completed: 1, total: 1 };
  state.header!.counters.steps = { completed: 16, total: 16 };
  colors.length = 0;
  renderHeaderDeck(state, 160, theme as never);
  assert.ok(
    !colors.some((entry) => entry.includes('task 1/1') || entry.includes('stps 16/16')),
  );
});

test('uses prompt-line color for rules and major separators with violet ladybugs', () => {
  const colors: string[] = [];
  const theme = {
    fg: (semanticColor: string, text: string) => {
      colors.push(`${semanticColor}:${text}`);
      return text;
    },
    bold: (text: string) => text,
  };

  renderHeaderDeck(fixture(), 160, theme as never);

  assert.ok(colors.some((entry) => entry.startsWith('thinkingHigh:─')));
  assert.ok(colors.includes('thinkingHigh:⟩'));
  assert.equal(colors.filter((entry) => entry.startsWith('text:┈')).length, 1);
  assert.equal(colors.filter((entry) => entry === 'customMessageLabel:󰠭').length, 1);
  assert.equal(
    colors.some((entry) => entry.startsWith('thinkingMax:')),
    false,
  );
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

test('keeps compact telemetry islands together with one gap cell', () => {
  const modelGroup = '󰚩 GPT-5.6 Sol › high ⟩ 󰾆 38% › 󰎞 2 ›  63%';
  const resources = '48.2% › 268M ⟩ 3/3 ⟩ 󰜦 $5.16';
  const lines = renderHeaderDeck(fixture(), 120, plainTheme as never);
  assert.match(lines.join('\n'), new RegExp(`${escapeRegExp(modelGroup)}$`, 'm'));
  assert.match(lines.join('\n'), new RegExp(`${escapeRegExp(resources)}$`, 'm'));
});

test('keeps child-run and subagent counters visible and changes only their color', () => {
  const state = fixture();
  const colors: string[] = [];
  const theme = {
    fg: (semanticColor: string, text: string) => {
      colors.push(`${semanticColor}:${plain(text)}`);
      return text;
    },
    bold: (text: string) => text,
  };

  state.header!.counters.activeRuns = { children: 0, subagents: 0 };
  let lines = renderHeaderDeck(state, 160, theme as never);
  const counterRow = plain(lines[2] ?? '');
  assert.ok(counterRow.includes("000:07'00"));
  // Relocation phase: runs ride the lifecycle row, off the title band.
  assert.match(plain(lines[4] ?? ''), /^. 00 › . 00 ⟩ waiting/u);
  assert.ok(colors.includes('dim: 00'));
  assert.doesNotMatch(lines[0] ?? '', /||󰈙/u);

  colors.length = 0;
  state.header!.counters.activeRuns = { children: 1, subagents: 0 };
  lines = renderHeaderDeck(state, 160, theme as never);
  assert.ok(plain(lines[2] ?? '').includes("000:07'00"));
  assert.match(plain(lines[4] ?? ''), /^. 01 › . 00 ⟩ waiting/u);
  assert.ok(colors.includes('accent: 01'));
  assert.ok(colors.includes('dim: 00'));

  colors.length = 0;
  state.header!.counters.activeRuns = { children: 3, subagents: 2 };
  lines = renderHeaderDeck(state, 160, theme as never);
  assert.ok(plain(lines[2] ?? '').includes("000:07'00"));
  assert.match(plain(lines[4] ?? ''), /^. 03 › . 02 ⟩ waiting/u);
  assert.ok(colors.includes('accent: 03'));
  assert.ok(colors.includes('accent: 02'));
});

test('never leaves a telemetry separator dangling at narrow widths', () => {
  for (let width = 20; width <= 100; width += 1) {
    const lines = renderHeaderDeck(fixture(), width, plainTheme as never);
    assert.ok(
      lines.every((line) => !/[›⟩]\s*$/u.test(plain(line))),
      String(width),
    );
  }
});

test('preserves ANSI-safe width with a coloring theme', () => {
  const ansiTheme = {
    fg: (_semanticColor: string, text: string) => `\u001b[35m${text}\u001b[0m`,
    bold: (text: string) => `\u001b[1m${text}\u001b[22m`,
  };

  for (const width of [160, 100, 79, 59, 39, 20]) {
    const lines = renderHeaderDeck(fixture(), width, ansiTheme as never);
    assert.ok(
      lines.every((line) => visibleWidth(line) <= width),
      String(width),
    );
  }
});

test('preserves width and essential deck structure through responsive collapse', () => {
  for (const width of [160, 100, 79, 59, 39, 20]) {
    const lines = renderHeaderDeck(fixture(), width, plainTheme as never);
    assert.ok(lines.length >= 4, String(width));
    assert.ok(
      lines.every((line) => visibleWidth(line) <= width),
      String(width),
    );
    assert.ok(
      lines.some((line) => plain(line).includes("󰠭 000:07'00")),
      String(width),
    );
    assert.equal(lines.join('').split('󰠭').length - 1, 1, String(width));
    if (width >= 79) {
      assert.match(lines.join('\n'), /000:07'00/u, String(width));
      assert.match(lines.join('\n'), /󰾆 38%/u, String(width));
    }
  }
});

test('renders unavailable optional telemetry honestly', () => {
  const state = fixture();
  state.header = null;
  state.elapsedMs = null;
  state.footerTelemetry = undefined;
  state.contextPercent = undefined;
  state.contextTokens = undefined;
  state.contextWindow = undefined;
  state.resources = undefined;
  state.lsp = null;
  state.mcp = null;
  state.branch = '';
  state.gitAvailable = false;

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  const all = lines.join('\n');
  // Frozen contract: absent facts remove their slots — the frame collapses
  // without a single placeholder dash or emptiness narration.
  // Counter removal lockstep: placeholders are gone with the tiles.
  assert.equal(
    lines.some((line) => line.includes('—')),
    false,
  );
  // Counter removal lockstep: without counters the title's right end is
  // silent — Work renders nothing for pre-title publishers (no placeholder).
  assert.equal(plain(lines[2] ?? '').includes('task 00/00'), false);
  assert.equal(plain(lines[2] ?? '').includes('stps 00/00'), false);
  assert.equal(plain(lines[2] ?? '').trim(), "󰠭 000:00'00");
  assert.doesNotMatch(all, /next direction/u);
  assert.equal(all.includes('task'), false);
  assert.equal(all.includes('stps'), false);
  const status = lines.find((line) => line.includes('waiting')) ?? '';
  // Frozen contract: full silence when nothing is running or selected.
  assert.equal(status, '');
  // Frozen contract: absent Git removes the segment entirely.
  assert.ok(all.includes('(no Git)'));
});

const CAL_ICON = '󰃰';
const FLAME_ICON = '󰈸';
const CLOCK_ICON = '󰅐';

test('paints icon-native quota tiles in cost, calendar, flame order', () => {
  const state = fixture();
  state.footerTelemetry = {
    totalCost: 5.16,
    quotaWindows: [
      {
        label: '5h',
        percent: 82,
        resetAt: Math.floor(Date.now() / 1000) + 90 * 60 + 30,
      },
      {
        label: '7d',
        percent: 12,
        resetAt: Math.floor(Date.now() / 1000) + 6 * 86_400,
      },
    ],
  };
  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  const telemetryLine = plain(
    lines.find((line: string) => line.includes('$5.16')) ?? '',
  );
  const statusLine = plain(
    lines.find((line: string) => line.includes('GPT-5.6 Sol')) ?? '',
  );

  // Relocation phase: the calendar rides the model group; flame and cost
  // keep the telemetry row's far end.
  const calendarAt = statusLine.indexOf(`${CAL_ICON} 12%`);
  const flameAt = telemetryLine.indexOf(`${FLAME_ICON} 82%`);
  const costAt = telemetryLine.indexOf('$5.16');
  assert.ok(calendarAt >= 0, 'calendar tile renders');
  assert.ok(flameAt >= 0, 'flame tile renders');
  assert.ok(costAt > flameAt, 'cost anchors the far end');
  assert.ok(
    telemetryLine.includes(`${FLAME_ICON} 82% › ${CLOCK_ICON} 1:30`),
    'coding tile carries clock countdown',
  );
});

test('classifies minute and day labels and always counts down the coding window', () => {
  const state = fixture();
  state.footerTelemetry = {
    totalCost: 5.16,
    quotaWindows: [
      {
        label: '90m',
        percent: 52,
        resetAt: Math.floor(Date.now() / 1000) + 45 * 60 + 10,
      },
      { label: '30d', percent: 40 },
    ],
  };
  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  const telemetryLine = plain(
    lines.find((line: string) => line.includes('$5.16')) ?? '',
  );
  const statusLine = plain(
    lines.find((line: string) => line.includes('GPT-5.6 Sol')) ?? '',
  );

  assert.ok(statusLine.includes(`${CAL_ICON} 40%`), 'day label is calendar');
  assert.ok(
    telemetryLine.includes(`${FLAME_ICON} 52% › ${CLOCK_ICON} 0:45`),
    'cool coding window still counts down',
  );
});

test('coding window without reset time paints flame without clock', () => {
  const state = fixture();
  state.footerTelemetry = {
    totalCost: 5.16,
    quotaWindows: [{ label: '5h', percent: 62 }],
  };
  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  const telemetryLine = plain(
    lines.find((line: string) => line.includes('$5.16')) ?? '',
  );
  const tail = telemetryLine.slice(telemetryLine.indexOf(FLAME_ICON));
  assert.ok(tail.startsWith(`${FLAME_ICON} 62%`));
  assert.ok(!tail.includes(CLOCK_ICON) && !tail.includes(':'));
});

test('weekly-only telemetry paints the calendar tile alone', () => {
  const state = fixture();
  state.footerTelemetry = {
    totalCost: 5.16,
    quotaWindows: [
      {
        label: '7d',
        percent: 33,
        resetAt: Math.floor(Date.now() / 1000) + 5 * 86_400,
      },
    ],
  };
  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  const statusLine = plain(
    lines.find((line: string) => line.includes('GPT-5.6 Sol')) ?? '',
  );

  const tail = statusLine.slice(statusLine.indexOf(CAL_ICON));
  assert.ok(tail.startsWith(`${CAL_ICON} 33%`));
  assert.ok(!tail.includes(FLAME_ICON));
  assert.ok(!tail.includes(CLOCK_ICON), 'calendar never carries a countdown');
});

test('renders elastic span rows naming each live child run', () => {
  const state = fixture();
  state.header!.activeRunSpans = [
    {
      id: 'sub-1:reviewer',
      kind: 'subagent',
      parent: 'sub-1',
      agent: 'reviewer',
      stage: 'assuring',
      elapsedMs: 41_000,
    },
    {
      id: 'bash-2',
      kind: 'bash',
      parent: 'turn-1',
      label: 'pytest',
      stage: 'working',
      elapsedMs: 10_000,
    },
  ];
  const lines = renderHeaderDeck(state, 120, plainTheme as never);
  const reviewer = lines.find((line) => line.includes('reviewer')) ?? '';
  assert.match(reviewer, /├ \(00'41\) reviewer assuring/u);
  const bashRow = lines.find((line) => line.includes('pytest')) ?? '';
  assert.match(bashRow, /└ \(00'10\) pytest working/u);
});

test('span rows collapse when no child runs are live', () => {
  const lines = renderHeaderDeck(fixture(), 120, plainTheme as never);
  assert.equal(
    lines.some((line) => line.includes('├') || line.includes('└')),
    false,
  );
});

// --- Step 2.1: line 2 on the title-state contract ---------------------------

const IDLE_TITLE = {
  v: 1 as const,
  subject: 'Pivot cockpit to pure pi-starship-header chrome',
  work: null,
  activity: null,
  waiver: null,
};

function titleFixture(overrides: {
  title?: unknown;
  elapsedMs?: number | null;
}): HeaderDeckState {
  const state = fixture();
  state.elapsedMs = overrides.elapsedMs ?? null;
  if ('title' in overrides) {
    state.header = {
      ...(state.header as NonNullable<typeof state.header>),
      // Production snapshots are always parseHeaderSnapshot output — the
      // fixture models that boundary by parsing raw payloads here.
      ...(overrides.title === null
        ? {}
        : { title: parseDeckTitleState(overrides.title) }),
    };
  }
  return state;
}

test('renders line 2 as clock ⟩ Subject with the Work label on the right', () => {
  const state = titleFixture({
    title: {
      ...IDLE_TITLE,
      work: { change: 'eight-section-deck', task: '2.1', done: 1, total: 4 },
    },
    elapsedMs: 4_120,
  });

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const titleRow = lines.find((line) => line.includes("000:04'12")) ?? '';
  assert.ok(
    titleRow.startsWith(
      "󰠭 000:04'12 ⟩ Pivot cockpit to pure pi-starship-header chrome",
    ),
  );
  assert.ok(titleRow.includes('eight-section-deck · 1/4'));
  // The optional task segment is parsed for the contract but never rendered —
  // the accepted mockup shows exactly `change · done/total`.
  assert.equal(titleRow.includes('2.1 ·'), false);
});

test('renders the dim no-work hint when no change owns the moment', () => {
  const state = titleFixture({ title: IDLE_TITLE });

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const titleRow = lines.find((line) => line.includes("000:00'00")) ?? '';
  assert.ok(titleRow.includes('— no change owns the moment'));
  const colors: string[] = [];
  renderHeaderDeck(state, 120, {
    fg: (name: string, text: string) => {
      colors.push(`${name}:${plain(text)}`);
      return text;
    },
    bold: (text: string) => text,
  } as never);
  assert.ok(colors.includes('dim:— no change owns the moment'));
});

test('renders the clock leading alone when the subject is null', () => {
  const state = titleFixture({ title: { ...IDLE_TITLE, subject: null } });

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const titleRow = lines[2] ?? '';
  assert.ok(titleRow.startsWith("󰠭 000:00'00"));
  assert.doesNotMatch(titleRow, /⟩\s*$/u);
  assert.doesNotMatch(titleRow, /󰠭\s+⟩/u);
  // The fresh session still owns its right end: the work hint stays.
  assert.ok(titleRow.includes('— no change owns the moment'));
});

test('colors the Work label by completion and drops it on narrow frames', () => {
  const state = titleFixture({
    title: { ...IDLE_TITLE, work: { change: 'eight-section-deck', done: 1, total: 4 } },
  });
  const colors: string[] = [];
  const theme = {
    fg: (name: string, text: string) => {
      colors.push(`${name}:${plain(text)}`);
      return text;
    },
    bold: (text: string) => text,
  };

  renderHeaderDeck(state, 120, theme as never);
  assert.ok(colors.includes('text:eight-section-deck · 1/4'));

  colors.length = 0;
  const done = titleFixture({
    title: { ...IDLE_TITLE, work: { change: 'eight-section-deck', done: 4, total: 4 } },
  });
  renderHeaderDeck(done, 120, theme as never);
  assert.ok(colors.includes('success:eight-section-deck · 4/4'));

  // Narrow frames: the Work slot yields before the clock anchor does.
  const narrow = renderHeaderDeck(state, 39, plainTheme as never).map(plain);
  assert.ok((narrow[2] ?? '').includes("000:00'00"));
  assert.equal((narrow[2] ?? '').includes('eight-section-deck · 1/4'), false);
});

test('keeps pre-title publishers on the legacy selection band with a silent right end', () => {
  const lines = renderHeaderDeck(fixture(), 120, plainTheme as never).map(plain);
  const titleRow = lines.find((line) => line.includes("000:07'00")) ?? '';
  assert.ok(titleRow.includes('Read-only preflight'));
  // No title state means no Work slot: absent facts stay silent, and the
  // superseded counter tiles never come back to fill the gap.
  assert.equal(titleRow.includes('·'), false);
  assert.equal(titleRow.includes('no change owns the moment'), false);
});

test('ignores a malformed title state and falls back to the legacy band', () => {
  const state = titleFixture({ title: { v: 9, subject: 'stale' } });

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const titleRow = lines.find((line) => line.includes("000:00'00")) ?? '';
  assert.ok(titleRow.includes('Read-only preflight'), 'selection keeps the band');
  assert.equal(titleRow.includes('stale'), false);
});

test('wraps a long subject onto an indented continuation line', () => {
  const subject =
    'Deliver one deliberately long session subject that needs a second responsive line without inventing new machinery';
  const state = titleFixture({ title: { ...IDLE_TITLE, subject } });

  const lines = renderHeaderDeck(state, 100, plainTheme as never).map(plain);
  const first = lines.findIndex((line) => line.includes("000:00'00"));
  assert.ok(first >= 0);
  assert.ok((lines[first] ?? '').startsWith("󰠭 000:00'00 ⟩ Deliver one deliberately"));
  assert.ok((lines[first + 1] ?? '').startsWith(' '.repeat(12)));
  assert.ok((lines[first + 1] ?? '').includes('machinery'));
});

test('prefixes the unfocused open-goal hint to the subject until notices land', () => {
  const state = titleFixture({ title: IDLE_TITLE });
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    openGoals: 2,
  };

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const titleRow = lines.find((line) => line.includes("000:00'00")) ?? '';
  assert.match(
    titleRow,
    /󰠭 000:00'00 ⟩ \(2 open goals · \/goal-focus\) Pivot cockpit/u,
  );
});
