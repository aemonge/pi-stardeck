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
      // Task 3.1: the fixture models a clean deck — approval/blocked ride
      // the notice slot now, and the accepted mockups show line 4's right
      // end owned by the machine group when clean.
      approvalRequired: false,
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

  // Seven-row deck (third 2.4 amendment): L1, ─, L2, ┈, L3, ┈, L4 — the
  // strong rule opens the deck and the deck ends at the telemetry row;
  // the internal seams stay dotted.
  assert.equal(lines.length, 7);
  // Second 2.4 amendment: the full solid rule returns beneath line 1.
  assert.match(plain(lines[1] ?? ''), /^─+$/u);
  const titleRow = plain(lines[2] ?? '');
  assert.ok(titleRow.startsWith("󰠭 000:07'00 ⟩ Read-only preflight"));
  assert.ok(titleRow.includes("000:07'00"));
  const activityRow = plain(lines[4] ?? '');
  // Line 3 (four-line deck): idle renders `awaiting Human`; the
  // lifecycle/suggestion/runs tiles are gone with the status row.
  assert.ok(activityRow.trimEnd().endsWith('awaiting Human'));
  assert.doesNotMatch(activityRow, /\bwaiting\b/u);
  assert.equal(activityRow.includes('requesting validation'), false);
  // Counter removal lockstep: Work owns line 2's right end — task/stps
  // tiles never render there again (accepted mockups supersede them).
  assert.equal(titleRow.includes('task 0/1'), false);
  assert.equal(titleRow.includes('stps 6/16'), false);
  assert.equal(plain(lines[3] ?? ''), '┈'.repeat(160));
  assert.match(lines[3] ?? '', /^\[2m/u);
  assert.match(plain(lines[0] ?? ''), /^\[.\] [\u{E000}-\u{F8FF}] ~\/galactica ⟩/u);
  assert.match(plain(lines[0] ?? ''), /feature\/review-led/u);
  // Step 2.3 relocation: the companion chips ride line 1's right end.
  assert.match(plain(lines[0] ?? ''), /\[\u{21BB} \u{25A4}\] \u{232C}  \u{26E8}$/u);
  // Line 4 split (second 2.4 amendment): the engine group anchors the
  // left end; the machine group anchors the right end on the same row.
  const telemetryRow = plain(lines[6] ?? '');
  assert.ok(telemetryRow.includes('GPT-5.6 Sol'));
  assert.ok(telemetryRow.trimEnd().endsWith('$5.16'));
  assert.match(
    lines[6] ?? '',
    /^\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F0F86} 38% \u{203A} \u{F039E} 2 \u{203A} \u{F241} 63%/u,
  );
  assert.match(
    lines[6] ?? '',
    /\s{2,}48\.2% \u{203A} 268M \u{27E9} 3\/3 \u{27E9} \u{F0726} \$5\.16$/u,
  );
  // Dotted seam above line 4; the deck ends at the telemetry row.
  assert.match(plain(lines[5] ?? ''), /^┈+$/u);
  assert.equal(lines.join('\n').includes('32K/128K'), false);
  assert.ok(lines.every((line) => line.length > 0));
  assert.ok(lines.every((line) => !line.startsWith('│}') && !line.endsWith('│')));
  assert.equal(lines.join('').split('󰠭').length - 1, 1);
  assert.equal(lines.join('').includes('󱒋 LSP'), false);
});

test('turns the top ladybug into distinct error and warning counts', () => {
  const state = fixture();
  state.piStatus = { errors: 2, warnings: 3, nativeStatusCount: 0 };

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  // 2.4 amendment: the severity counts ride line 1 beside the chips.
  const line1 = plain(lines[0] ?? '');
  assert.match(line1, /\u{F0159} 2 › \u{F071} 3 ⟩ \/pi-status/u);
  assert.match(
    line1,
    /\[\u{21BB} \u{25A4}\] \u{232C}  \u{26E8}$/u,
    'chips keep the right end',
  );
  assert.equal(line1.split('⟩').length - 1, 2, 'path separator + alert command');
  assert.doesNotMatch(line1, /\u{F082D}/u);
  assert.ok((lines[0] ?? '').includes('\u001b[7m'), 'counts stay reverse-video');

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

test('drops the footer count; the strong rule opens the deck', () => {
  const state = fixture();
  state.piStatus = { errors: 0, warnings: 0, nativeStatusCount: 3 };

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  // Second 2.4 amendment: the solid rule rides beneath line 1 again —
  // clean or alerting, the rule is constant (third amendment: it is the
  // only one; the deck ends at the telemetry row).
  assert.match(plain(lines[1] ?? ''), /^\u2500+$/u);
  assert.match(plain(lines[2] ?? ''), /^\u{F082D} 000:07'00/u);
  assert.equal(lines.join('').includes('·3'), false);
  // Relocation phase: the footer count is deleted; the anchor echo remains.
  assert.doesNotMatch(lines.at(-1) ?? '', /[0-9] ‹/u);

  const ansiTheme = {
    fg: (_semanticColor: string, text: string) => `\u001b[35m${text}\u001b[0m`,
    bold: (text: string) => `\u001b[1m${text}\u001b[22m`,
  };
  const wrapped = renderHeaderDeck(state, 59, ansiTheme as never);
  assert.ok(wrapped.every((line) => visibleWidth(line) <= 59));
  const solidRules = wrapped.filter((line) => /^─+$/u.test(plain(line)));
  assert.equal(solidRules.length, 1, 'the lone strong rule opens the deck');
  const dottedSeams = wrapped.filter((line) => /^┈+$/u.test(plain(line)));
  assert.equal(dottedSeams.length, 2, 'dotted seams inside the deck');

  state.piStatus.nativeStatusCount = 0;
  const empty = renderHeaderDeck(state, 160, plainTheme as never);
  assert.doesNotMatch(empty[2] ?? '', /·0/u);
});

test('unfocused open goals leave line 2 for the notice slot', () => {
  const state = fixture();
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    openGoals: 1,
  };

  const lines = renderHeaderDeck(state, 160, plainTheme as never).map(plain);
  const titleRow = lines.find((line) => line.includes("000:07'00")) ?? '';
  // Task 3.1: the hint's line-2 prefix is gone — the notice slot absorbed
  // it (design: "notices absorb the unfocused open-goal hint").
  assert.doesNotMatch(titleRow, /open goal/u);
  assert.doesNotMatch(titleRow, /\/goal-focus/u);
  assert.match(titleRow, /000:07'00 ⟩ Read-only preflight/u);
  const line4 = lines.find((line) => line.includes('GPT-5.6 Sol')) ?? '';
  assert.ok(line4.trimEnd().endsWith('⚠ 1 open goal · /goal-focus'));
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
  // Step 2.3 relocation: the path heads line 1; the chips ride its right
  // end (bold, spacing, and on/warn/off colors unchanged).
  assert.match(telemetry, /^\[.\] [\u{E000}-\u{F8FF}] ~/u);
  assert.match(telemetry, /\[\u{21BB} \u{25A4}\] \u{232C}  \u{26E8}$/u);
  assert.ok(telemetry.indexOf('~/') < telemetry.indexOf('\u{232C}'));
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

  // Sharing line 1 with the always-visible chips, the alert compacts one
  // step earlier than it did on its own rule row (2.4 amendment).
  const compact = plain(renderHeaderDeck(state, 20, plainTheme as never)[0] ?? '');
  assert.match(compact, /\u{F0159} 5/u);
  assert.doesNotMatch(compact, /pi-status/u);
  assert.doesNotMatch(compact, /\u{F0159} 2/u);
  assert.match(compact, /\u{232C}/u, 'chips stay visible beside the alert');

  // Extreme narrow: the chips own line 1 and the alert yields entirely.
  const narrow = renderHeaderDeck(state, 9, plainTheme as never);
  assert.doesNotMatch(narrow.join(''), /\u{F0159}/u);
  assert.match(plain(narrow[0] ?? ''), /\u{232C}/u);
  assert.ok(narrow.every((line) => visibleWidth(line) <= 9));
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
  const activityRow = plain(lines[4] ?? '');
  // Line 3 (four-line deck): the legacy observed activity owns the slot —
  // the stage label and suggestion cue are gone (accepted mockups).
  assert.ok(activityRow.trimEnd().endsWith('verify'));
  assert.equal(activityRow.includes('assuring'), false);
  assert.equal(activityRow.includes('requesting validation or redirection'), false);
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
  assert.doesNotMatch(wide[5] ?? '', /Parent Plan title/u);
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
  assert.doesNotMatch(wide[5] ?? '', /One focused work title/u);
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

  assert.ok(bolded.includes('[󰆧]'));
  assert.ok(bolded.includes('⟩'));
  for (const regular of [
    'awaiting Human',
    "000:07'00",
    'Read-only preflight for the interrupted one-line Review ledger fix',
    'before further OpenSpec validation and implementation',
    ' ~/galactica',
    ' feature/review-ledger/preserve-openspec-validation',
    'GPT-5.6 Sol',
  ]) {
    assert.equal(bolded.includes(regular), false, regular);
  }
});

test('colors the legacy activity label on line 3 and keeps nothing bold', () => {
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

  renderHeaderDeck(state, 160, theme as never);

  assert.ok(colors.includes('text:verify'));
  assert.ok(colors.includes('accent:Plan title › Current task'));
  assert.equal(bolded.includes('verify'), false);
  assert.equal(bolded.includes('assuring'), false);
});

test('renders every legacy activity class on line 3 without stage narration', () => {
  const state = fixture();
  state.header!.selection = null;
  state.header!.work = {
    lifecycle: 'working',
    titles: ['Repair runtime state'],
    color: 'accent',
    activity: { kind: 'recovery' },
  };
  const lines = renderHeaderDeck(state, 160, plainTheme as never).map(plain);
  const activityRow = lines[4] ?? '';
  assert.ok(activityRow.includes('recovering'));
  assert.equal(activityRow.includes('working'), false);

  // Idle without observed activity still reads `awaiting Human`.
  state.header!.work = null;
  const idle = renderHeaderDeck(state, 160, plainTheme as never).map(plain);
  assert.ok((idle[4] ?? '').includes('awaiting Human'));
});

test('reports the observed activity on line 3 while active without a cue', () => {
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
  const activityRow = plain(lines[4] ?? '');

  assert.ok(activityRow.trimEnd().endsWith('implementing'));
  assert.equal(activityRow.includes('step 7/16'), false);
  assert.equal(activityRow.includes('requesting'), false);
  // Without a selection the clock leads line 2 alone.
  assert.ok(plain(lines[2] ?? '').startsWith("󰠭 000:07'00"));
  assert.doesNotMatch(plain(lines[2] ?? ''), /Plan title/u);
});

test('renders the selected work title exactly once across the deck', () => {
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
  assert.ok(titleLine.includes(echoTitle), 'selection band shows the title');
  // No-echo contract: the title renders exactly once across the whole deck.
  assert.equal(lines.join('\n').split(echoTitle).length - 1, 1);
});

test('keeps the clock accent and the counters absent in every counter state', () => {
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

  assert.ok(colors.includes("accent:000:07'00"));
  assert.ok(!colors.some((entry) => entry.endsWith(':idle')));
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

// --- Line 4 split (second 2.4 amendment) -----------------------------------

test('splits line 4 into engine and machine islands with a wide gap', () => {
  const engineGroup = '󰚩 GPT-5.6 Sol › high ⟩ 󰾆 38% › 󰎞 2 ›  63%';
  const machineGroup = '48.2% › 268M ⟩ 3/3 ⟩ 󰜦 $5.16';
  const lines = renderHeaderDeck(fixture(), 120, plainTheme as never).map(plain);
  // Line 4 split: the engine group sits flush left, the machine group
  // flush right, with the wide gap between them. The fixture subject
  // wraps at this width, so the row is located by its engine lead.
  const line4 = lines.find((line) => line.includes('GPT-5.6 Sol')) ?? '';
  assert.ok(line4.startsWith(engineGroup), 'engine group flush left');
  assert.ok(line4.endsWith(machineGroup), 'machine group flush right');
  const gap = line4.slice(engineGroup.length, line4.length - machineGroup.length);
  assert.ok(/^ {2,}$/u.test(gap), 'a wide gap separates the two groups');
});

test('renders no task, stps, or run-counter tiles in any state', () => {
  const state = fixture();
  const variants: Array<() => void> = [
    () => {},
    () => {
      state.header!.counters.activeRuns = { children: 0, subagents: 0 };
      state.header!.counters.tasks = undefined;
      state.header!.counters.steps = undefined;
    },
    () => {
      state.header!.counters.activeRuns = { children: 3, subagents: 2 };
      state.header!.counters.tasks = { completed: 0, total: 0 };
    },
    () => {
      state.header = null;
    },
  ];
  for (const apply of variants) {
    apply();
    for (const width of [160, 120, 79, 60, 39, 20]) {
      const rendered = renderHeaderDeck(state, width, plainTheme as never).map(plain);
      for (const forbidden of ['task 00/00', 'stps 00/00', '00 › 00']) {
        assert.equal(
          rendered.some((line) => line.includes(forbidden)),
          false,
          `${forbidden} at ${width}`,
        );
      }
    }
  }
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
  assert.doesNotMatch(all, /clean/u);
  assert.equal(all.includes('task'), false);
  assert.equal(all.includes('stps'), false);
  // Line 3 idle reads `awaiting Human`; without a published turn meter the
  // cost slot stays silent rather than narrating zeros it cannot know.
  assert.equal(plain(lines[4] ?? '').trimEnd(), ' awaiting Human');
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

test('moves the unfocused open-goal hint off the title band into notices', () => {
  const state = titleFixture({ title: IDLE_TITLE });
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    openGoals: 2,
  };

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const titleRow = lines.find((line) => line.includes("000:00'00")) ?? '';
  // Task 3.1 lockstep: the parenthesized prefix no longer rides line 2…
  assert.match(titleRow, /󰠭 000:00'00 ⟩ Pivot cockpit/u);
  assert.doesNotMatch(titleRow, /open goals/u);
  // …it rides the notice slot on line 4 right, plural-aware.
  const line4 = lines.find((line) => line.includes('GPT-5.6 Sol')) ?? '';
  assert.ok(line4.trimEnd().endsWith('⚠ 2 open goals · /goal-focus'));
});

// --- Step 2.2: line 3 on the title-state contract ---------------------------

const TURN_MIDWORK = { tokens: 4_200, elapsedMs: 38_000 };

test('renders line 3 idle as awaiting Human with the zeroed turn meter', () => {
  const state = titleFixture({ title: IDLE_TITLE });
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    turn: { tokens: 0, elapsedMs: 0 },
  };

  const lines = renderHeaderDeck(state, 100, plainTheme as never).map(plain);
  const activityRow = lines.find((line) => line.includes('awaiting Human')) ?? '';
  assert.ok(activityRow.startsWith(' awaiting Human'));
  assert.ok(activityRow.trimEnd().endsWith('— · 0 tok'));
});

test('renders line 3 mid-work as editing target with this-turn cost', () => {
  const state = titleFixture({
    title: {
      ...IDLE_TITLE,
      activity: {
        class: 'editing',
        target: 'packages/pi-stardeck/src/deck.ts',
        span: 't87',
        parent: null,
      },
    },
    elapsedMs: 4_120,
  });
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    turn: TURN_MIDWORK,
  };

  const lines = renderHeaderDeck(state, 100, plainTheme as never).map(plain);
  const activityRow = lines.find((line) => line.includes('editing')) ?? '';
  assert.ok(activityRow.includes(' editing packages/pi-stardeck/src/deck.ts'));
  assert.ok(activityRow.trimEnd().endsWith('this turn 4.2k · 0:38'));
});

test('renders every observed activity class with its target', () => {
  for (const [class_, expected] of [
    ['reading', 'reading schema.yaml'],
    ['grepping', 'grepping title-state'],
    ['bash', 'bash npm run test:stardeck'],
    ['subagent', 'subagent: scout'],
  ] as const) {
    const state = titleFixture({
      title: {
        ...IDLE_TITLE,
        activity: { class: class_, target: 'x', span: 't1', parent: null },
      },
    });
    state.header = {
      ...(state.header as NonNullable<typeof state.header>),
      title: {
        ...IDLE_TITLE,
        activity: {
          class: class_,
          target: class_ === 'subagent' ? 'scout' : expected.slice(class_.length + 1),
          span: 't1',
          parent: null,
        },
      },
    };
    const lines = renderHeaderDeck(state, 100, plainTheme as never).map(plain);
    const activityRow =
      lines.find((line) => line.includes('awaiting Human') || line.includes(class_)) ??
      '';
    assert.ok(activityRow.includes(` ${expected}`), expected);
  }
});

test('keeps the turn-cost slot silent for pre-title publishers', () => {
  const lines = renderHeaderDeck(fixture(), 100, plainTheme as never).map(plain);
  const activityRow = lines.find((line) => line.includes('awaiting Human')) ?? '';
  assert.ok(activityRow.includes('awaiting Human'));
  assert.equal(activityRow.includes('0 tok'), false);
  assert.equal(activityRow.includes('this turn'), false);
});

test('colors the activity and turn meter by liveness', () => {
  const colors: string[] = [];
  const theme = {
    fg: (name: string, text: string) => {
      colors.push(`${name}:${plain(text)}`);
      return text;
    },
    bold: (text: string) => text,
  };
  const idle = titleFixture({ title: IDLE_TITLE });
  idle.header = {
    ...(idle.header as NonNullable<typeof idle.header>),
    turn: { tokens: 0, elapsedMs: 0 },
  };
  renderHeaderDeck(idle, 100, theme as never);
  assert.ok(colors.includes('dim:awaiting Human'));
  assert.ok(colors.includes('dim:— · 0 tok'));

  colors.length = 0;
  const midwork = titleFixture({
    title: {
      ...IDLE_TITLE,
      activity: { class: 'bash', target: 'npm test', span: 'b2', parent: 't9' },
    },
  });
  midwork.header = {
    ...(midwork.header as NonNullable<typeof midwork.header>),
    turn: { tokens: 980, elapsedMs: 65_000 },
  };
  renderHeaderDeck(midwork, 100, theme as never);
  assert.ok(colors.includes('text:bash npm test'));
  assert.ok(colors.includes('accent:this turn 980 · 1:05'));
});

test('spans rows keep their home directly beneath line 3', () => {
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
  ];
  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const activityIndex = lines.findIndex((line) => line.includes('awaiting Human'));
  assert.ok(activityIndex >= 0);
  assert.match(lines[activityIndex + 1] ?? '', /└ \(00'41\) reviewer assuring/u);
  // A ┈ seam follows the spans rows, then line 4 — the deck ends at
  // the telemetry row.
  assert.match(lines[activityIndex + 2] ?? '', /^┈+$/u);
  assert.ok(lines[activityIndex + 3]?.includes('GPT-5.6 Sol'));
  assert.equal(
    lines.length,
    activityIndex + 4,
    'nothing renders beneath the telemetry row',
  );
});

// --- Step 2.3: line 1 right relocation and line 4 ---------------------------

test('relocates companion chips to line 1 right and bolds them', () => {
  const state = fixture();
  state.piStatus = {
    errors: 0,
    warnings: 0,
    nativeStatusCount: 1,
    nativeStatuses: [{ key: 'engram', text: 'ready' }],
  };
  const bolded: string[] = [];
  const theme = {
    fg: (_name: string, text: string) => text,
    bold: (text: string) => {
      bolded.push(text);
      return text;
    },
  };

  const lines = renderHeaderDeck(state, 120, theme as never).map(plain);
  const line1 = lines[0] ?? '';
  assert.ok(line1.includes('~/galactica'));
  assert.match(line1, /\[\u{21BB} \u{25A4}\] \u{232C}  \u{26E8}$/u);
  assert.ok(bolded.includes('[\u{21BB} \u{25A4}]'), 'chips stay bold');
});

test('keeps companion chips on line 1 right while the path yields first', () => {
  const state = fixture();
  for (const width of [79, 60, 39, 24, 14]) {
    const lines = renderHeaderDeck(state, width, plainTheme as never).map(plain);
    const line1 = lines[0] ?? '';
    assert.match(line1, /\[\u{21BB} \u{25A4}\] \u{232C}  \u{26E8}$/u, String(width));
    if (width >= 39) assert.ok(line1.includes('~/'), String(width));
  }
});

test('keeps the devbox marker as a path prefix on line 1 left', () => {
  const lines = renderHeaderDeck(fixture(), 120, plainTheme as never).map(plain);
  const line1 = lines[0] ?? '';
  assert.match(line1, /^\[.\] \u{F07B} ~/u);
  assert.match(line1, /\[\u{21BB} \u{25A4}\] \u{232C}  \u{26E8}$/u);
});

test('splits line 4 into engine left and machine right islands', () => {
  const state = fixture();
  state.footerTelemetry = {
    totalCost: 5.16,
    quotaWindows: [
      {
        label: '5h',
        percent: 82,
        resetAt: Math.floor(Date.now() / 1000) + 90 * 60 + 30,
      },
      { label: '7d', percent: 12 },
    ],
  };
  const lines = renderHeaderDeck(state, 160, plainTheme as never).map(plain);
  const line4 = lines[6] ?? '';
  const engineAt = line4.indexOf('GPT-5.6 Sol');
  const calendarAt = line4.indexOf('12%');
  const flameAt = line4.indexOf('82%');
  const machineAt = line4.indexOf('48.2%');
  const mcpAt = line4.indexOf('3/3');
  const costAt = line4.indexOf('$5.16');
  assert.ok(line4.startsWith('󰚩'), 'engine group anchors the left end');
  assert.ok(engineAt >= 0 && calendarAt > engineAt, 'calendar rides the engine group');
  assert.ok(flameAt > calendarAt, 'quota flame leads the machine group');
  assert.ok(machineAt > flameAt, 'machine after the flame');
  assert.ok(mcpAt > machineAt, 'mcp rides the machine group');
  assert.ok(costAt > mcpAt, 'global cost anchors the right end');
  assert.ok(line4.trimEnd().endsWith('$5.16'));
  // Narrow ladder: the machine group yields before the engine group —
  // engine/context stays visible while any telemetry fits. The subject
  // wraps at this width, so the row is located by its engine lead.
  const narrow = renderHeaderDeck(state, 60, plainTheme as never).map(plain);
  const narrow4 = narrow.find((line) => line.includes('GPT-5.6 Sol')) ?? '';
  assert.ok(narrow4.includes('GPT-5.6 Sol'), 'engine group stays visible');
  assert.equal(narrow4.includes('$5.16'), false, 'machine group yields first');
});

test('line 4 right: machine group when clean, notices when warning', () => {
  const state = fixture();
  state.piStatus = {
    errors: 2,
    warnings: 1,
    nativeStatusCount: 2,
    nativeStatuses: [{ key: 'graphify', text: 'graphify stale · update recommended' }],
  };
  const lines = renderHeaderDeck(state, 160, plainTheme as never).map(plain);
  const line4 = lines[6] ?? '';
  // Task 3.1 placement default: non-empty notices own line 4's right end
  // and the machine group yields wholesale; the engine group stays left.
  assert.ok(
    line4.trimEnd().endsWith('⚠ graphify stale · update recommended'),
    'notice anchors the right end',
  );
  assert.ok(line4.startsWith('󰚩'), 'engine group stays flush left');
  assert.equal(line4.includes('$5.16'), false, 'machine group yields wholesale');
  assert.equal(line4.includes('48.2%'), false);
  assert.equal(line4.includes('3/3'), false);

  state.piStatus = { errors: 2, warnings: 1, nativeStatusCount: 0 };
  const clean = renderHeaderDeck(state, 160, plainTheme as never).map(plain);
  const clean4 = clean[6] ?? '';
  // Clean: the machine group keeps the right end and no glyph renders.
  assert.ok(clean4.trimEnd().endsWith('$5.16'), 'cost anchors the machine group');
  assert.equal(clean4.includes('⚠'), false);
  // Severity counts (line 1) and notices stay distinct surfaces.
  assert.match(plain(clean[0] ?? ''), /⟩ \/pi-status/u);
});

test('opens the deck with a strong rule and dotted internal seams', () => {
  // Single-line subject at this width so the band count is fixed at seven.
  const lines = renderHeaderDeck(
    titleFixture({ title: IDLE_TITLE }),
    100,
    plainTheme as never,
  ).map(plain);
  assert.equal(lines.length, 7);
  assert.match(lines[1] ?? '', /^─+$/u, 'strong rule beneath line 1');
  assert.match(lines[3] ?? '', /^┈+$/u, 'dotted seam beneath line 2');
  assert.match(lines[5] ?? '', /^┈+$/u, 'dotted seam beneath line 3');
  assert.ok((lines[6] ?? '').includes('GPT-5.6 Sol'));
  // The deck ends at the telemetry row — nothing renders beneath it.
  assert.equal(lines[6], lines.at(-1));
});

// --- Step 2.4: the two accepted mockups as lockstep fixtures ----------------
//
// Ground truth: plan.md Task 2. The mockups transcribe the deck's non-PUA
// glyphs verbatim; nerd-font icons (branch marker, git dirt entries) do not
// survive plain-text transcription, so `main › +2` is read as the dirty git
// entries with two modified files, and the stale `packages/header` target is
// the pre-rename spelling of `packages/pi-stardeck`.

function mockupDeckState(): HeaderDeckState {
  const state = titleFixture({ title: IDLE_TITLE });
  state.cwd = '~/projects/pi-vimux-starship';
  state.devbox = false;
  state.branch = 'main';
  state.gitAvailable = true;
  return state;
}

test('renders the accepted idle mockup at wide widths', () => {
  const state = mockupDeckState();
  state.git = { staged: 0, modified: 0, untracked: 0, conflicts: 0 };
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    title: parseDeckTitleState(IDLE_TITLE),
    turn: { tokens: 0, elapsedMs: 0 },
  };

  const lines = renderHeaderDeck(state, 100, plainTheme as never).map(plain);
  assert.equal(lines.length, 7);
  // Line 1: path/git left, companion chips right.
  assert.match(
    lines[0] ?? '',
    /^\u{F07B} ~\/projects\/pi-vimux-starship \u{27E9} \u{E725} main \u{203A} \u{F00C} clean\s+\[\u{21BB} \u{25A4}\] \u{232C}  \u{26E8}$/u,
  );
  // Second 2.4 amendment: the strong rule returns beneath line 1.
  assert.match(lines[1] ?? '', /^\u2500+$/u);
  // Line 2: clock + Subject left, the dim no-work hint right.
  assert.match(
    lines[2] ?? '',
    /^\u{F082D} 000:00'00 \u{27E9} Pivot cockpit to pure pi-starship-header chrome\s+\u2014 no change owns the moment$/u,
  );
  assert.match(lines[3] ?? '', /^\u2508+$/u);
  // Line 3: awaiting Human left, the zeroed turn meter right.
  assert.match(lines[4] ?? '', /^ awaiting Human\s+\u2014 \u00b7 0 tok$/u);
  assert.match(lines[5] ?? '', /^\u2508+$/u);
  // Line 4 splits across the row: engine left, machine right — the deck
  // ends at the telemetry row (third 2.4 amendment).
  assert.match(
    lines[6] ?? '',
    /^\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F0F86} 38% \u{203A} \u{F039E} 2 \u{203A} \u{F241} 63%\s{2,}48\.2% \u{203A} 268M \u{27E9} 3\/3 \u{27E9} \u{F0726} \$5\.16$/u,
  );
});

test('renders the accepted mid-work mockup at wide widths', () => {
  const state = mockupDeckState();
  state.git = { staged: 0, modified: 2, untracked: 0, conflicts: 0 };
  state.elapsedMs = 4_120;
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    title: parseDeckTitleState({
      ...IDLE_TITLE,
      work: { change: 'eight-section-deck', task: '2.1', done: 1, total: 4 },
      activity: {
        class: 'editing',
        target: 'packages/pi-stardeck/src/deck.ts',
        span: 't87',
        parent: null,
      },
    }),
    turn: { tokens: 4_200, elapsedMs: 38_000 },
  };

  const lines = renderHeaderDeck(state, 100, plainTheme as never).map(plain);
  assert.equal(lines.length, 7);
  // Line 1: `main › +2` in the mockup is the dirty-entry transcription —
  // two modified files ride the git segment.
  assert.match(
    lines[0] ?? '',
    /^\u{F07B} ~\/projects\/pi-vimux-starship \u{27E9} \u{E725} main \u{203A} \u{F040} 2\s+\[\u{21BB} \u{25A4}\] \u{232C}  \u{26E8}$/u,
  );
  // Strong rule beneath line 1 (second 2.4 amendment).
  assert.match(lines[1] ?? '', /^\u2500+$/u);
  // Line 2: Work owns the right end with `change · done/total`.
  assert.match(
    lines[2] ?? '',
    /^\u{F082D} 000:04'12 \u{27E9} Pivot cockpit to pure pi-starship-header chrome\s+eight-section-deck \u00b7 1\/4$/u,
  );
  // Line 3: observed activity left, this-turn cost right.
  assert.match(
    lines[4] ?? '',
    /^ editing packages\/pi-stardeck\/src\/deck\.ts\s+this turn 4\.2k \u00b7 0:38$/u,
  );
  // Dotted seams inside; line 4 splits across the row and the deck ends
  // at the telemetry row (third 2.4 amendment).
  assert.match(lines[3] ?? '', /^\u2508+$/u);
  assert.match(lines[5] ?? '', /^\u2508+$/u);
  assert.match(
    lines[6] ?? '',
    /^\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F0F86} 38% \u{203A} \u{F039E} 2 \u{203A} \u{F241} 63%\s{2,}48\.2% \u{203A} 268M \u{27E9} 3\/3 \u{27E9} \u{F0726} \$5\.16$/u,
  );
});

test('renders both mockups identically at 100 and 120 columns', () => {
  const state = mockupDeckState();
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    title: parseDeckTitleState(IDLE_TITLE),
    turn: { tokens: 0, elapsedMs: 0 },
  };
  for (const width of [100, 120]) {
    const lines = renderHeaderDeck(state, width, plainTheme as never).map(plain);
    assert.ok((lines[0] ?? '').includes('~/projects/pi-vimux-starship'), String(width));
    assert.ok((lines[2] ?? '').includes('Pivot cockpit'), String(width));
    assert.ok((lines[4] ?? '').includes('awaiting Human'), String(width));
  }
});

// --- Step 3.1: the unified notice slot --------------------------------------

test('aggregates mixed notices ranked goal hint, companion, diagnostics', () => {
  const state = titleFixture({ title: IDLE_TITLE });
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    openGoals: 1,
    diagnostics: {
      text: '2E  1W  ✗ tests',
      color: 'error',
      state: 'fail',
      count: 2,
    },
  };
  state.piStatus = {
    errors: 0,
    warnings: 0,
    nativeStatusCount: 1,
    nativeStatuses: [{ key: 'appa', text: 'appa unreachable' }],
  };

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const line4 = lines.find((line) => line.includes('GPT-5.6 Sol')) ?? '';
  // The accepted mixed render, verbatim (spec scenario: one open goal,
  // appa unreachable, two diagnostics).
  assert.ok(
    line4
      .trimEnd()
      .endsWith('⚠ 1 open goal · /goal-focus · appa unreachable · 2 diagnostics'),
  );
  assert.equal(line4.includes('$5.16'), false, 'machine group yields to notices');
});

test('restores blocked and approval signals as companion-group notices', () => {
  const state = titleFixture({ title: IDLE_TITLE });
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    blocked: true,
    approvalRequired: true,
  };

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const line4 = lines.find((line) => line.includes('GPT-5.6 Sol')) ?? '';
  // Top of the companion group: blocked before approval, publisher wording.
  assert.ok(line4.trimEnd().endsWith('⚠ ⛔ blocked · approval required'));

  const colors: string[] = [];
  const theme = {
    fg: (name: string, text: string) => {
      colors.push(`${name}:${plain(text)}`);
      return text;
    },
    bold: (text: string) => text,
  };
  renderHeaderDeck(state, 120, theme as never);
  assert.ok(colors.includes('error:⚠ ⛔ blocked · approval required'));

  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    blocked: false,
  };
  colors.length = 0;
  renderHeaderDeck(state, 120, theme as never);
  const approvalOnly = renderHeaderDeck(state, 120, plainTheme as never)
    .map(plain)
    .find((line) => line.includes('GPT-5.6 Sol'));
  assert.ok(approvalOnly?.trimEnd().endsWith('⚠ approval required'));
  assert.ok(colors.includes('warning:⚠ approval required'));
});

test('notices ride the narrow ladder beside the engine group', () => {
  const state = titleFixture({ title: IDLE_TITLE });
  state.piStatus = {
    errors: 0,
    warnings: 0,
    nativeStatusCount: 1,
    nativeStatuses: [{ key: 'appa', text: 'appa unreachable' }],
  };

  // Wide: the notice owns the right end; the machine group yielded.
  const wide = renderHeaderDeck(state, 160, plainTheme as never).map(plain);
  const wide4 = wide.find((line) => line.includes('GPT-5.6 Sol')) ?? '';
  assert.ok(wide4.trimEnd().endsWith('⚠ appa unreachable'));
  assert.equal(wide4.includes('$5.16'), false);

  // The notice rides the same fit ladder as the machine group: it renders
  // only when it fits beside the engine group at full width.
  const fits = renderHeaderDeck(state, 79, plainTheme as never).map(plain);
  assert.ok(
    (fits.find((line) => line.includes('GPT-5.6 Sol')) ?? '')
      .trimEnd()
      .endsWith('⚠ appa unreachable'),
    'notice fits beside the engine group at 79',
  );
  for (const width of [60, 39, 20]) {
    const narrow = renderHeaderDeck(state, width, plainTheme as never);
    assert.match(
      plain(narrow.at(-1) ?? ''),
      /GPT-5\.6 Sol/u,
      `engine group survives at ${width}`,
    );
    assert.equal(
      plain(narrow.at(-1) ?? '').includes('⚠'),
      false,
      `notice yields wholesale at ${width}`,
    );
    assert.ok(
      narrow.every((line) => visibleWidth(line) <= width),
      String(width),
    );
  }
});

test('keeps the notice slot empty and silent when clean', () => {
  const state = titleFixture({ title: IDLE_TITLE });
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    openGoals: 0,
    diagnostics: {
      text: 'clean  ✓ tests',
      color: 'success',
      state: 'pass',
      count: 0,
    },
  };
  state.piStatus = {
    errors: 0,
    warnings: 0,
    nativeStatusCount: 1,
    nativeStatuses: [{ key: 'graphify', text: 'graphify active · report available' }],
  };

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const line4 = lines.find((line) => line.includes('GPT-5.6 Sol')) ?? '';
  // Clean: no glyph, no slot — the machine group keeps line 4's right end.
  assert.equal(lines.join('\n').includes('⚠'), false);
  assert.ok(line4.trimEnd().endsWith('$5.16'));
  // Healthy companion texts never surface as notices.
  assert.equal(lines.join('\n').includes('report available'), false);
});

// --- Step 3.2: waiver suppression -------------------------------------------

function waiverFixture(
  waiver: { id: string; notice: string } | null,
  overrides: {
    openGoals?: number;
    nativeStatuses?: Array<{ key: string; text: string }>;
  } = {},
): HeaderDeckState {
  const state = titleFixture({ title: IDLE_TITLE });
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    ...(overrides.openGoals !== undefined ? { openGoals: overrides.openGoals } : {}),
    title: parseDeckTitleState({ ...IDLE_TITLE, waiver }),
  };
  if (overrides.nativeStatuses) {
    state.piStatus = {
      errors: 0,
      warnings: 0,
      nativeStatusCount: overrides.nativeStatuses.length,
      nativeStatuses: overrides.nativeStatuses,
    };
  }
  return state;
}

test('waiver suppresses exactly its matching notice text', () => {
  const noticeText = 'graphify · update recommended';
  const state = waiverFixture(
    { id: 'graphify-stale', notice: noticeText },
    {
      openGoals: 1,
      nativeStatuses: [
        { key: 'graphify', text: noticeText },
        { key: 'appa', text: 'appa unreachable' },
      ],
    },
  );

  const lines = renderHeaderDeck(state, 140, plainTheme as never).map(plain);
  const line4 = lines.find((line) => line.includes('GPT-5.6 Sol')) ?? '';
  // Exactly the waived text leaves the slot; the other notices remain.
  assert.ok(line4.trimEnd().endsWith('⚠ 1 open goal · /goal-focus · appa unreachable'));
  assert.equal(line4.includes(noticeText), false);
});

test('removing the waiver restores exactly its notice', () => {
  const noticeText = 'graphify · update recommended';
  const waived = waiverFixture(
    { id: 'graphify-stale', notice: noticeText },
    { nativeStatuses: [{ key: 'graphify', text: noticeText }] },
  );
  const restored = waiverFixture(null, {
    nativeStatuses: [{ key: 'graphify', text: noticeText }],
  });

  const waivedLine = renderHeaderDeck(waived, 140, plainTheme as never)
    .map(plain)
    .find((line) => line.includes('GPT-5.6 Sol'));
  assert.equal(waivedLine?.includes('⚠'), false, 'waived sole notice empties the slot');
  // Suppression-only semantics: a null waiver restores the notice while
  // the machine group loses the right end again.
  const restoredLines = renderHeaderDeck(restored, 140, plainTheme as never).map(plain);
  const restoredLine = restoredLines.find((line) => line.includes('GPT-5.6 Sol')) ?? '';
  assert.ok(restoredLine.trimEnd().endsWith(`⚠ ${noticeText}`));
  assert.equal(restoredLine.includes('$5.16'), false);
});

test('a waiver matching no live notice text is inert', () => {
  const state = waiverFixture(
    { id: 'stale-waiver', notice: 'engram down' },
    { nativeStatuses: [{ key: 'graphify', text: 'graphify · update recommended' }] },
  );

  const lines = renderHeaderDeck(state, 140, plainTheme as never).map(plain);
  const line4 = lines.find((line) => line.includes('GPT-5.6 Sol')) ?? '';
  // Exact-text matching: a waiver for a notice that is not live suppresses
  // nothing — the live companion warning still renders.
  assert.ok(line4.trimEnd().endsWith('⚠ graphify · update recommended'));
});

test('a waiver can suppress the open-goal hint by its exact text', () => {
  const state = waiverFixture(
    { id: 'open-goal-hint', notice: '1 open goal · /goal-focus' },
    { openGoals: 1 },
  );

  const lines = renderHeaderDeck(state, 140, plainTheme as never).map(plain);
  const line4 = lines.find((line) => line.includes('GPT-5.6 Sol')) ?? '';
  assert.equal(lines.join('\n').includes('/goal-focus'), false);
  assert.equal(line4.includes('⚠'), false, 'sole notice waived empties the slot');
  assert.ok(
    line4.trimEnd().endsWith('$5.16'),
    'machine group returns to the right end',
  );
});
