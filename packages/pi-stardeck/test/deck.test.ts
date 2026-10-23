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
  console.error(
    'FIX120:',
    JSON.stringify(renderHeaderDeck(fixture(), 120, plainTheme as never).map(plain)),
  );
  console.error(
    'FIXLAST60:',
    JSON.stringify(
      renderHeaderDeck(fixture(), 60, plainTheme as never)
        .map(plain)
        .at(-1),
    ),
  );
  console.error(
    'FIXLAST40:',
    JSON.stringify(
      renderHeaderDeck(fixture(), 40, plainTheme as never)
        .map(plain)
        .at(-1),
    ),
  );

  console.error(
    'DUMP:',
    JSON.stringify(renderHeaderDeck(fixture(), 160, plainTheme as never).map(plain)),
  );
  console.error(
    'DUMP120:',
    JSON.stringify(renderHeaderDeck(fixture(), 120, plainTheme as never).map(plain)),
  );

  const lines = renderHeaderDeck(fixture(), 160, plainTheme as never);

  // deck-reshape (amended), quiet-activity-row: five rows — L1, ─, L2,
  // ┈, L4 (engine left, status right when it speaks); the idle line-3
  // band and its seam retire (zero activity never narrates itself).
  assert.equal(lines.length, 5);
  // Second 2.4 amendment: the full solid rule returns beneath line 1.
  assert.match(plain(lines[1] ?? ''), /^─+$/u);
  const titleRow = plain(lines[2] ?? '');
  assert.ok(titleRow.startsWith("󰠭 000:07'00 ⟩ Read-only preflight"));
  assert.ok(titleRow.includes("000:07'00"));
  // quiet-activity-row: idle renders no line-3 band at all; the
  // lifecycle/suggestion/runs tiles stay gone with the status row.
  const deckText = lines.map(plain).join('\n');
  assert.equal(deckText.includes('awaiting Human'), false);
  assert.doesNotMatch(deckText, /\bwaiting\b/u);
  assert.equal(deckText.includes('requesting validation'), false);
  // Counter removal lockstep: Work owns line 2's right end — task/stps
  // tiles never render there again (accepted mockups supersede them).
  assert.equal(titleRow.includes('task 0/1'), false);
  assert.equal(titleRow.includes('stps 6/16'), false);
  assert.equal(plain(lines[3] ?? ''), '┈'.repeat(160));
  assert.match(lines[3] ?? '', /^\[2m/u);
  assert.match(
    plain(lines[0] ?? ''),
    /^\u{F01A7} \u{F04E6} \u{F1049} \u{F0498} \u{27E9} \u{F07B} ~\/galactica \u{27E9}/u,
  );
  assert.match(plain(lines[0] ?? ''), /feature\/review-led/u);
  // deck-machine-corner: the corner owns line 1's right end — devbox lead
  // chip, companion chips, one major separator, icon-led machine group.
  assert.match(
    plain(lines[0] ?? ''),
    /\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F241} 63%$/u,
  );
  // deck-reshape: the engine group anchors line 1's right end beside
  // the machine corner; the clean status row carries only the sentinel.
  assert.equal(lines.join('\n').includes('32K/128K'), false);
  assert.equal(lines.join('\n').includes('healthy'), false, 'placeholder retired');
  assert.ok(lines.every((line) => line.length > 0));
  assert.ok(lines.every((line) => !line.startsWith('│}') && !line.endsWith('│')));
  // Ladybug census (sentinel amendment): exactly two — the line-2 clock
  // anchor and the line-4 healthy sentinel.
  assert.equal(lines.join('').split('󰠭').length - 1, 2);
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
    /\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F241} 63%$/u,
    'the corner keeps the right end',
  );
  assert.equal(
    line1.split('⟩').length - 1,
    4,
    'identity sep + path sep + engine quota sep + alert',
  );
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
  // quiet-activity-row: the status seam remains; the idle band's seam
  // retires with the band itself.
  assert.equal(dottedSeams.length, 1, 'one dotted seam inside the deck');

  state.piStatus.nativeStatusCount = 0;
  const empty = renderHeaderDeck(state, 160, plainTheme as never);
  assert.doesNotMatch(empty[2] ?? '', /·0/u);
});

test('extension statuses ride the telemetry tail as icons', () => {
  const state = fixture();
  state.piStatus = {
    errors: 0,
    warnings: 0,
    nativeStatusCount: 2,
    nativeStatuses: [
      { key: 'engram', text: '\u{1F9E0} pi-stardeck · ready' },
      { key: 'graphify', text: 'graphify active · report available' },
    ],
  };

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const telemetry = lines[0] ?? '';
  // deck-reshape: the chips LEAD line 1 ahead of the path; the engine
  // group anchors the right end ahead of the machine corner.
  assert.match(
    telemetry,
    /^\u{F01A7} \u{F04E6} \u{F1049} \u{F0498} \u{27E9} \u{F07B} ~\//u,
  );
  assert.match(
    telemetry,
    /\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F241} 63%$/u,
  );
  assert.ok(
    telemetry.indexOf('~/') > telemetry.indexOf('\u{F1049}'),
    'the identity cluster precedes the path',
  );
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
  const brain = seen.find((entry) => entry.text === '\u{F04E6}');
  const graph = seen.find((entry) => entry.text === '\u{F1049}');
  const shield = seen.find((entry) => entry.text === '\u{F0498}');
  assert.equal(brain?.color, 'accent');
  assert.equal(graph?.color, 'warning');
  assert.equal(shield?.color, 'error', 'off renders error-red like error');
});

test('chip color encodes severity: blue healthy, yellow degraded, red error and off', () => {
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
    nativeStatusCount: 3,
    nativeStatuses: [
      { key: 'engram', text: 'engram ready' },
      { key: 'graphify', text: 'graphify stale · update recommended' },
      { key: 'appa', text: 'appa unreachable' },
    ],
  };

  renderHeaderDeck(state, 120, spyTheme);
  // Variant C verdict: bold foreground colors alone — blue healthy,
  // yellow degraded, red error/off; no enclosures anywhere.
  assert.ok(seen.some((e) => e.text === '\u{F04E6}' && e.color === 'accent'));
  assert.ok(
    seen.some((e) => e.text === '\u{F1049}' && e.color === 'warning'),
    'degraded renders warning yellow',
  );
  assert.ok(
    seen.some((e) => e.text === '\u{F0498}' && e.color === 'error'),
    'error renders error red',
  );
  assert.equal(
    seen.some((e) => /[[\]()]/u.test(e.text)),
    false,
    'no enclosures survive',
  );
  const line1 = renderHeaderDeck(state, 120, plainTheme as never).map(plain)[0] ?? '';
  assert.match(
    line1,
    /\u{F01A7} \u{F04E6} \u{F1049} \u{F0498} \u{27E9}/u,
    'mixed state: blue devbox KO and red appa, bare icons throughout',
  );
});

test('known companion icons are always present', () => {
  const bare = renderHeaderDeck(fixture(), 120, plainTheme as never).map(plain);
  assert.match(bare[0] ?? '', /\u{F06A9}/u, 'engine rides line 1 right');
  assert.match(bare.at(-1) ?? '', /\u{F035B}/u, 'cpu anchors the bottom row');
});

test('extension status icons drop on narrow frames', () => {
  const state = fixture();
  state.piStatus = {
    errors: 0,
    warnings: 0,
    nativeStatusCount: 2,
    nativeStatuses: [
      { key: 'engram', text: 'ready' },
      { key: 'taskflow', text: 'run 2 active' },
    ],
  };
  const narrow = renderHeaderDeck(state, 60, plainTheme as never).map(plain);
  assert.match(narrow[0] ?? '', /\u{F1049}/u);
  assert.equal(
    narrow.some((line) => line.includes('taskflow')),
    false,
  );
});

test('drops the status command before severity counts at narrow widths', () => {
  const state = fixture();
  state.piStatus = { errors: 2, warnings: 3, nativeStatusCount: 0 };

  // deck-reshape: the identity cluster owns line 1's left; the alert
  // compacts beside it — command first, then counts, then everything.
  const compact = plain(renderHeaderDeck(state, 20, plainTheme as never)[0] ?? '');
  assert.match(compact, /\u{F0159} 2/u);
  assert.doesNotMatch(compact, /pi-status/u);
  assert.match(compact, /\u{F1049}/u, 'chips stay visible beside the alert');

  // Extreme narrow: the alert compacts to a single count; the identity
  // cluster never yields (always-visible contract).
  const narrow = renderHeaderDeck(state, 9, plainTheme as never);
  const narrow1 = plain(narrow[0] ?? '');
  assert.match(narrow1, /\u{F0159} 5/u, 'the worst count survives at 9');
  assert.match(narrow1, /\u{F01A7}/u, 'the devbox chip leads whatever fits');
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
  // quiet-activity-row: the idle band is gone at every width — no
  // `awaiting Human` narration and never an `idle` placeholder.
  assert.equal(
    narrow.some((line) => plain(line).includes('awaiting Human')),
    false,
  );
  assert.equal(
    narrow.some((line) => plain(line).includes('idle')),
    false,
  );
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

  assert.ok(bolded.includes('󰆧'));
  assert.ok(bolded.includes('\u{F04E6}'));
  assert.ok(bolded.includes('\u{F1049}'));
  assert.ok(bolded.includes('\u{F0498}'));
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

  // quiet-activity-row: idle without observed activity retires the band.
  state.header!.work = null;
  const idle = renderHeaderDeck(state, 160, plainTheme as never).map(plain);
  assert.equal(
    idle.some((line) => line.includes('awaiting Human')),
    false,
  );
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

test('the engine group rides line 1 right; the machine tail anchors the bottom row', () => {
  const lines = renderHeaderDeck(fixture(), 160, plainTheme as never).map(plain);
  // deck-reshape (swap amendment): short engine group upstairs so a
  // growing PWD/branch never fights the long machine tail; the tail
  // yields right-to-left on the bottom row.
  const line1 = lines[0] ?? '';
  assert.match(
    line1,
    /\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F241} 63%$/u,
    'engine group anchors line 1 right',
  );
  assert.match(
    lines.at(-1) ?? '',
    /^\u{F035B} 48\.2% \u{203A} \u{F061A} 268M \u{203A} 3\/3 \u{27E9} \u{F0F86} 38% \u{203A} \u{F039E} 2 \u{27E9} \u{F0726} \$5\.16\s+\u{F082D}$/u,
    'the full machine tail rides the bottom row',
  );
  assert.equal(lines.length, 5, 'five-row clean deck');
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
    // Clock anchor + healthy sentinel — the ladybug census is two.
    assert.equal(lines.join('').split('󰠭').length - 1, 2, String(width));
    assert.match(lines.join('\n'), /000:07'00/u, String(width));
    if (width >= 100) {
      // deck-reshape: the engine joined the corner — context survives
      // only from ~100 columns up.
      assert.match(lines.join('\n'), /󰾆 38%/u, String(width));
    }
  }
});

test('a live session without a subject renders the dim no-subject placeholder', () => {
  const state = fixture();
  // A session that reports Work but never sets a subject: the title
  // slot renders its dim hint instead of silence (2026-10-19 amendment,
  // mirroring the Work side's `— no change owns the moment`).
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    title: { subject: '', lifecycle: 'listening' } as never,
    selection: undefined,
  };
  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  assert.match(lines[2] ?? '', /^\u{F082D} 000:07'00 \u{27E9} — no subject/u);

  // Header present but title absent entirely (selection-less): same hint.
  const untitled = fixture();
  untitled.header = {
    ...(untitled.header as NonNullable<typeof untitled.header>),
    title: undefined,
    selection: undefined,
  };
  const untitledLines = renderHeaderDeck(untitled, 120, plainTheme as never).map(plain);
  assert.match(untitledLines[2] ?? '', /^\u{F082D} 000:07'00 \u{27E9} — no subject/u);
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
  // quiet-activity-row: idle without a meter retires the band — no
  // `awaiting Human`, no zero-cost narration it cannot know; the
  // engine row closes the deck.
  assert.equal(all.includes('awaiting Human'), false);
  assert.equal(all.includes('tok'), false);
  assert.ok(plain(lines[4] ?? '').includes('\u{F082D}'), 'the engine row closes');
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
  const calendarAt = statusLine.indexOf(`${CAL_ICON} 7d 12%`);
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

  assert.ok(statusLine.includes(`${CAL_ICON} 30d 40%`), 'day label is calendar');
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
  assert.ok(tail.startsWith(`${CAL_ICON} 7d 33%`));
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
  assert.ok(titleRow.includes('eight-section-deck › 󰄱 1/4'));
  // The optional task segment is parsed for the contract but never rendered —
  // the human-steered format shows `change › 󰄱 done/total`.
  assert.equal(titleRow.includes('2.1'), false);
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

test('colors the Work label segments and drops it on narrow frames', () => {
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
  assert.ok(colors.includes('accent:eight-section-deck'));
  assert.ok(colors.includes('accent:󰄱 1/4'));

  colors.length = 0;
  const done = titleFixture({
    title: { ...IDLE_TITLE, work: { change: 'eight-section-deck', done: 4, total: 4 } },
  });
  renderHeaderDeck(done, 120, theme as never);
  assert.ok(colors.includes('success:✔ 4/4'));

  // Narrow frames: the Work slot yields before the clock anchor does.
  const narrow = renderHeaderDeck(state, 39, plainTheme as never).map(plain);
  assert.ok((narrow[2] ?? '').includes("000:00'00"));
  assert.equal((narrow[2] ?? '').includes('eight-section-deck › 󰄱 1/4'), false);
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

// --- Step 2.2: line 3 on the title-state contract ---------------------------

const TURN_MIDWORK = { tokens: 4_200, elapsedMs: 38_000 };

test('hides the idle line-3 band; a speaking meter restores it', () => {
  // quiet-activity-row: `awaiting Human` + `— · 0 tok` is zero activity —
  // the band and its seam retire; real cost keeps the band speaking.
  const state = titleFixture({ title: IDLE_TITLE });
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    turn: { tokens: 0, elapsedMs: 0 },
  };

  const idle = renderHeaderDeck(state, 100, plainTheme as never).map(plain);
  assert.equal(
    idle.some((line) => line.includes('awaiting Human')),
    false,
  );
  assert.equal(
    idle.some((line) => line.includes('0 tok')),
    false,
  );
  const seams = idle.filter((line) => /^┈+$/u.test(line));
  assert.equal(seams.length, 1, 'one seam remains — the status seam');

  const costly = titleFixture({ title: IDLE_TITLE });
  costly.header = {
    ...(costly.header as NonNullable<typeof state.header>),
    turn: TURN_MIDWORK,
  };
  const lines = renderHeaderDeck(costly, 100, plainTheme as never).map(plain);
  const activityRow = lines.find((line) => line.includes('awaiting Human')) ?? '';
  assert.ok(
    activityRow.trimEnd().endsWith('this turn 4.2k · 0:38'),
    'cost keeps the band',
  );
});

test('renders live phase words between tools, never awaiting Human mid-turn', () => {
  // quiet-activity-row amendment: thinking gaps fall back to the header's
  // kind-based activity projection — the band appears at turn start with
  // the phase word and never claims `awaiting Human` while a turn runs.
  const state = titleFixture({ title: IDLE_TITLE });
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    activity: { kind: 'understanding' },
    turn: { tokens: 0, elapsedMs: 0 },
  };
  const lines = renderHeaderDeck(state, 100, plainTheme as never).map(plain);
  const activityRow = lines.find((line) => line.includes('interpreting')) ?? '';
  assert.ok(activityRow.length > 0, 'the phase word renders at turn start');
  assert.equal(
    lines.some((line) => line.includes('awaiting Human')),
    false,
  );

  // A tool observation outranks the phase word; a settled session (no
  // activity projection, no cost) keeps retiring the band.
  const toolState = titleFixture({
    title: {
      ...IDLE_TITLE,
      activity: { class: 'bash', target: 'npm test', span: 't1', parent: null },
    },
  });
  toolState.header = {
    ...(toolState.header as NonNullable<typeof state.header>),
    activity: { kind: 'implementation' },
    turn: TURN_MIDWORK,
  };
  const toolLines = renderHeaderDeck(toolState, 100, plainTheme as never).map(plain);
  const toolRow = toolLines.find((line) => line.includes('bash npm test')) ?? '';
  assert.ok(toolRow.length > 0, 'the precise tool label wins');
  assert.equal(
    toolLines.some((line) => line.includes('implementing')),
    false,
  );

  // answering-activity-kind: prose streaming keeps an honest label —
  // `answering` with the live meter, never `awaiting Human` mid-turn.
  const answering = titleFixture({ title: IDLE_TITLE });
  answering.header = {
    ...(answering.header as NonNullable<typeof answering.header>),
    activity: { kind: 'answering' },
    turn: TURN_MIDWORK,
  };
  const answeringLines = renderHeaderDeck(answering, 100, plainTheme as never).map(
    plain,
  );
  const answeringRow = answeringLines.find((line) => /\banswering\b/u.test(line)) ?? '';
  assert.ok(answeringRow.includes('this turn 4.2k'), 'the meter rides beside it');
  assert.equal(
    answeringLines.some((line) => line.includes('awaiting Human')),
    false,
  );
});

test('awaiting kinds are rest: a focused session still retires the band', () => {
  // The `awaiting-*` kinds are the post-settle rest face — they must not
  // keep the band alive at zero cost, or a focused session would never
  // rest (review-caught regression, quiet-activity-row amendment).
  const state = titleFixture({ title: IDLE_TITLE });
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    activity: { kind: 'awaiting-input' },
    turn: { tokens: 0, elapsedMs: 0 },
  };
  const lines = renderHeaderDeck(state, 100, plainTheme as never).map(plain);
  assert.equal(lines.length, 5, 'the band retires at rest');
  assert.equal(
    lines.some((line) => line.includes('awaiting Human')),
    false,
  );
  assert.equal(
    lines.some((line) => /\binput\b/u.test(line)),
    false,
  );

  const legacy = fixture();
  legacy.header!.work = {
    lifecycle: 'waiting',
    titles: ['Repair runtime state'],
    color: 'accent',
    activity: { kind: 'awaiting-validation' },
  };
  const legacyLines = renderHeaderDeck(legacy, 100, plainTheme as never).map(plain);
  assert.equal(legacyLines.length, 6, 'the legacy path rests too');
  assert.equal(
    legacyLines.some((line) => line.includes('awaiting Human')),
    false,
  );
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
  assert.ok(activityRow.includes('editing packages/pi-stardeck/src/deck.ts'));
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
    assert.ok(activityRow.includes(expected), expected);
  }
});

test('keeps the turn-cost slot silent for pre-title publishers', () => {
  // quiet-activity-row: idle + meterless retires the band wholesale; a
  // speaking legacy activity renders its label with no cost narration.
  const idle = renderHeaderDeck(fixture(), 100, plainTheme as never).map(plain);
  assert.equal(
    idle.some((line) => line.includes('awaiting Human')),
    false,
  );
  assert.equal(
    idle.some((line) => line.includes('tok')),
    false,
  );

  const active = fixture();
  active.header!.work = {
    lifecycle: 'working',
    titles: ['Repair runtime state'],
    color: 'accent',
    activity: { kind: 'verification' },
  };
  const lines = renderHeaderDeck(active, 100, plainTheme as never).map(plain);
  const activityRow = lines.find((line) => line.includes('checking')) ?? '';
  assert.ok(activityRow.includes('checking'));
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
  // quiet-activity-row: the idle band retires — no dim placeholders.
  assert.equal(colors.includes('dim:awaiting Human'), false);
  assert.equal(colors.includes('dim:— · 0 tok'), false);

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
  // quiet-activity-row: the idle band retires, but its seam survives for
  // the spans rows, which keep their home directly beneath line 2.
  assert.equal(
    lines.some((line) => line.includes('awaiting Human')),
    false,
  );
  const spanIndex = lines.findIndex((line) =>
    /└ \(00'41\) reviewer assuring/u.test(line),
  );
  assert.ok(spanIndex >= 0);
  assert.match(lines[spanIndex - 1] ?? '', /^┈+$/u, 'the seam survives for spans');
  // A ┈ seam follows the spans rows, then the engine row closes the deck.
  assert.match(lines[spanIndex + 1] ?? '', /^┈+$/u);
  assert.ok(lines[spanIndex + 2]?.includes('48.2%'));
  assert.equal(lines.length, spanIndex + 3, 'the machine row closes the deck');
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
  assert.match(line1, /\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F241} 63%$/u);
  assert.ok(bolded.includes('\u{F04E6}'), 'chips stay bold');
});

test('keeps companion chips on line 1 right while the path yields first', () => {
  const state = fixture();
  for (const width of [79, 60, 39, 24, 14]) {
    const lines = renderHeaderDeck(state, width, plainTheme as never).map(plain);
    const line1 = lines[0] ?? '';
    assert.match(line1, /\u{F01A7} \u{F04E6} \u{F1049} \u{F0498}/u, String(width));
    if (width >= 39) assert.ok(line1.includes('~/'), String(width));
  }
  // deck-reshape (swap amendment): the short engine group rides line 1
  // right beside a growing path; the machine tail lives on the bottom
  // row where it has the whole width to breathe.
  assert.match(
    plain(renderHeaderDeck(state, 79, plainTheme as never)[0] ?? ''),
    /\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F241} 63%$/u,
    'the engine still rides line 1 at 79',
  );
  assert.match(
    plain(renderHeaderDeck(state, 60, plainTheme as never).at(-1) ?? ''),
    /\u{F035B} 48\.2% \u{203A} \u{F061A} 268M \u{203A} 3\/3 \u{27E9} \u{F0F86} 38% \u{203A} \u{F039E} 2 \u{27E9} \u{F0726} \$5\.16\s+\u{F082D}$/u,
    'the full machine tail rides the bottom row at 60 beside the sentinel',
  );
});

test('keeps the devbox chip leading the corner off the path', () => {
  const lines = renderHeaderDeck(fixture(), 120, plainTheme as never).map(plain);
  const line1 = lines[0] ?? '';
  assert.match(
    line1,
    /^\u{F01A7} \u{F04E6} \u{F1049} \u{F0498} \u{27E9} \u{F07B} ~\/galactica/u,
    'the path carries no devbox prefix',
  );
  assert.match(
    line1,
    /\u{F01A7} \u{F04E6} \u{F1049} \u{F0498} \u{27E9}/u,
    'devbox leads the identity cluster into the corner',
  );
  // Amendment 2026-10-19: the chip never disappears — outside devbox it
  // renders error-red brackets (KO), inside it is the bare blue OK chip.
  const seen: Array<{ color: string; text: string }> = [];
  const spyTheme = {
    fg: (semantic: string, text: string) => {
      seen.push({ color: semantic, text });
      return text;
    },
    bold: (text: string) => text,
  } as never;
  const outside = fixture();
  outside.devbox = false;
  const rawOutside = renderHeaderDeck(outside, 120, spyTheme);
  assert.ok(
    seen.some((e) => e.text === '\u{F01A7}' && e.color === 'error'),
    'outside devbox: bold red KO chip',
  );
  assert.match(
    rawOutside.map(plain)[0] ?? '',
    /\u{F01A7} \u{F04E6} \u{F1049} \u{F0498} \u{27E9}/u,
  );
  renderHeaderDeck(fixture(), 120, spyTheme);
  assert.ok(
    seen.some((e) => e.text === '\u{F01A7}' && e.color === 'accent'),
    'inside devbox: bold blue OK chip',
  );
});

test('flame leads the machine group in the corner; line 4 keeps the engine side', () => {
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
  console.error(
    'FL160:',
    JSON.stringify(renderHeaderDeck(state, 160, plainTheme as never).map(plain)),
  );
  const lines = renderHeaderDeck(state, 160, plainTheme as never).map(plain);
  const line1 = lines[0] ?? '';
  const flameAt = (lines.at(-1) ?? '').indexOf('82%');
  // deck-reshape (swap): the machine tail + flame anchor the bottom
  // row; the engine (with its calendar) rides line 1 right.
  const line4 = lines.at(-1) ?? '';
  const machineAt = line4.indexOf('48.2%');
  const mcpAt = line4.indexOf('3/3');
  const costAt = line4.indexOf('$5.16');
  assert.ok(flameAt >= 0 && machineAt > flameAt, 'quota flame leads the machine tail');
  assert.ok(mcpAt > machineAt, 'mcp rides the machine tail');
  assert.ok(costAt > mcpAt, 'global cost anchors the row');
  assert.ok(line4.trimEnd().endsWith('󰠭'), 'the sentinel closes the clean row');
  const engineAt = line1.indexOf('GPT-5.6 Sol');
  const calendarAt = line1.indexOf('12%');
  assert.ok(
    engineAt >= 0 && calendarAt > engineAt,
    'calendar rides the engine on line 1',
  );
  assert.equal(lines.length, 5, 'clean five-row deck');
  // Narrow: the bottom row has the full width — the whole tail rides
  // even when line 1 collapses to identity + path.
  const narrowBottom = plain(
    renderHeaderDeck(state, 62, plainTheme as never).at(-1) ?? '',
  );
  assert.ok(narrowBottom.includes('82%'), 'the flame rides the bottom row at 62');
  assert.equal(
    narrowBottom.includes('⚠'),
    false,
    'the notice yields wholesale at extreme narrow',
  );
});

test('line 4 right is notice-only; machine readings never leave line 1', () => {
  const state = fixture();
  state.piStatus = {
    errors: 2,
    warnings: 1,
    nativeStatusCount: 2,
    nativeStatuses: [{ key: 'graphify', text: 'graphify stale · update recommended' }],
  };
  const lines = renderHeaderDeck(state, 160, plainTheme as never).map(plain);
  const line4 = lines.at(-1) ?? '';
  // Task 3.1 placement default: non-empty notices own line 4's right end;
  // the engine group stays left. deck-machine-corner: the machine group
  // stays on line 1 through the warning — notices can no longer starve it.
  assert.ok(
    line4.trimEnd().endsWith('⚠ graphify stale · update recommended'),
    'notice anchors the right end',
  );
  assert.ok(line4.startsWith('󰍛'), 'machine tail anchors the row left');
  assert.match(
    lines[0] ?? '',
    /\/pi-status \u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F241} 63%$/u,
    'the engine rides line 1 beside the alert',
  );

  state.piStatus = { errors: 2, warnings: 1, nativeStatusCount: 0 };
  const clean = renderHeaderDeck(state, 160, plainTheme as never).map(plain);
  // deck-reshape (amended): the engine row stays when clean — status is
  // silent, no ⚠ glyph, calendar on the bottom row.
  assert.equal(clean.length, 5, 'engine row stays when clean');
  assert.equal(clean.join('\n').includes('⚠'), false);
  assert.ok((clean[0] ?? '').includes('63%'), 'calendar rides the engine on line 1');
  // Severity counts (line 1) and notices stay distinct surfaces.
  assert.match(plain(clean[0] ?? ''), /⟩ \/pi-status/u);
});

test('machine corner yields right-to-left in frozen order; identity never drops', () => {
  const state = fixture();
  const machine = ['48.2%', '268M', '3/3', '38%', '\u{F039E} 2', '$5.16'];
  for (let width = 20; width <= 130; width += 1) {
    const rendered = renderHeaderDeck(state, width, plainTheme as never);
    const line1 = plain(rendered[0] ?? '');
    assert.match(
      line1,
      /\u{F01A7} \u{F04E6} \u{F1049} \u{F0498}/u,
      `identity cluster survives at ${width}`,
    );
    // Whatever machine segments survive form a prefix of the frozen order
    // (cpu › memory › mcp › context › summaries › cost): drops happen
    // right-to-left only.
    const bottom = rendered.at(-1) ?? '';
    const present = machine.filter((token) => bottom.includes(token));
    const lastIndex = machine.reduce(
      (acc, token, index) => (bottom.includes(token) ? index : acc),
      -1,
    );
    assert.equal(present.length, lastIndex + 1, `prefix yield order at ${width}`);
    if (bottom.includes('48.2%')) {
      assert.ok(true, `cpu anchors the bottom row at ${width}`);
    }
    assert.ok(
      rendered.every((line) => visibleWidth(line) <= width),
      `fits at ${width}`,
    );
  }
});

test('opens the deck with a strong rule and dotted internal seams', () => {
  // Single-line subject at this width so the band count is fixed at five
  // (quiet-activity-row: the idle band and its seam retire).
  const lines = renderHeaderDeck(
    titleFixture({ title: IDLE_TITLE }),
    100,
    plainTheme as never,
  ).map(plain);
  // deck-reshape (swap): engine rides line 1; the machine row closes.
  assert.equal(lines.length, 5);
  assert.match(lines[1] ?? '', /^─+$/u, 'strong rule beneath line 1');
  assert.match(lines[3] ?? '', /^┈+$/u, 'dotted seam beneath line 2');
  assert.ok((lines[0] ?? '').includes('GPT-5.6 Sol'));
  assert.ok((lines[4] ?? '').includes('48.2%'));
  assert.equal(lines[4], lines.at(-1));
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
  state.cwd = '~/projects/pi-stardeck';
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

  console.error(
    'IDLE:',
    JSON.stringify(renderHeaderDeck(state, 120, plainTheme as never).map(plain)),
  );
  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  // deck-reshape + quiet-activity-row: clean mockup is five rows — the
  // idle band retires; no status row.
  assert.equal(lines.length, 5);
  // Line 1: identity leads the path; the engine anchors the corner right.
  assert.match(
    lines[0] ?? '',
    /^\u{F01A7} \u{F04E6} \u{F1049} \u{F0498} \u{27E9} \u{F07B} ~\/projects\/pi-stardeck \u{27E9} \u{E725} main \u{203A} \u{F00C} clean\s+\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F241} 63%$/u,
  );
  // Second 2.4 amendment: the strong rule returns beneath line 1.
  assert.match(lines[1] ?? '', /^\u2500+$/u);
  // Line 2: clock + Subject left, the dim no-work hint right.
  assert.match(
    lines[2] ?? '',
    /^\u{F082D} 000:00'00 \u{27E9} Pivot cockpit to pure pi-starship-header chrome\s+\u2014 no change owns the moment$/u,
  );
  assert.match(lines[3] ?? '', /^\u2508+$/u);
  // quiet-activity-row: the idle band retires — the machine tail anchors
  // the bottom row directly beneath the seam; the sentinel closes it.
  assert.match(
    lines[4] ?? '',
    /^\u{F035B} 48\.2% \u{203A} \u{F061A} 268M \u{203A} 3\/3 \u{27E9} \u{F0F86} 38% \u{203A} \u{F039E} 2 \u{27E9} \u{F0726} \$5\.16\s+\u{F082D}$/u,
  );
  assert.equal(lines.join('\n').includes('healthy'), false);
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

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  // deck-reshape: five rows clean; the engine leads the corner and the
  // git segment yields its width (`ma…`).
  assert.match(
    lines[0] ?? '',
    /^\u{F01A7} \u{F04E6} \u{F1049} \u{F0498} \u{27E9} \u{F07B} ~\/projects\/pi-stardeck \u{27E9} \u{E725} main \u{203A} \u{F040} 2\s+\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F241} 63%$/u,
  );
  // At 100 the path truncates (`~/project…`) while the corner rides.
  const hundred = renderHeaderDeck(state, 100, plainTheme as never).map(plain);
  assert.match(
    hundred[0] ?? '',
    /main \u{203A} \u{F040} 2\s+\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F241} 63%$/u,
  );
  // Strong rule beneath line 1 (second 2.4 amendment).
  assert.match(lines[1] ?? '', /^\u2500+$/u);
  // Line 2: Work owns the right end with `change › 󰄱 done/total`.
  assert.match(
    lines[2] ?? '',
    /^\u{F082D} 000:04'12 \u{27E9} Pivot cockpit to pure pi-starship-header chrome\s+eight-section-deck › 󰄱 1\/4$/u,
  );
  // Line 3: observed activity left, this-turn cost right.
  assert.match(
    lines[4] ?? '',
    /^editing packages\/pi-stardeck\/src\/deck\.ts\s+this turn 4\.2k \u00b7 0:38$/u,
  );
  // Dotted seams inside; the engine row closes the deck with the sentinel.
  assert.match(lines[3] ?? '', /^\u2508+$/u);
  assert.match(lines[5] ?? '', /^\u2508+$/u);
  assert.match(
    lines[6] ?? '',
    /^\u{F035B} 48\.2% \u{203A} \u{F061A} 268M \u{203A} 3\/3 \u{27E9} \u{F0F86} 38% \u{203A} \u{F039E} 2 \u{27E9} \u{F0726} \$5\.16\s+\u{F082D}$/u,
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
    assert.ok((lines[0] ?? '').includes('~/project'), String(width));
    assert.ok((lines[2] ?? '').includes('Pivot cockpit'), String(width));
    // quiet-activity-row: the idle band is gone; the engine row rides
    // directly beneath the title seam.
    assert.ok((lines[4] ?? '').includes('48.2%'), String(width));
    assert.equal(
      lines.some((line) => line.includes('awaiting Human')),
      false,
      String(width),
    );
  }
});

test('the dim ladybug sentinel yields to notices and survives bare states', () => {
  // Sentinel amendment (healthy-ladybug-sentinel): the status right end
  // always speaks. Clean -> dim 󰠭; any notice replaces it wholesale; a
  // zero-telemetry deck still closes with the sentinel row.
  const clean = titleFixture({ title: IDLE_TITLE });
  const cleanLines = renderHeaderDeck(clean, 120, plainTheme as never).map(plain);
  assert.ok(
    (cleanLines.at(-1) ?? '').trimEnd().endsWith('󰠭'),
    'clean ends with the sentinel',
  );

  const warned = titleFixture({ title: IDLE_TITLE });
  warned.piStatus = {
    errors: 0,
    warnings: 0,
    nativeStatusCount: 1,
    nativeStatuses: [{ key: 'appa', text: 'appa unreachable' }],
  };
  const warnedLines = renderHeaderDeck(warned, 120, plainTheme as never).map(plain);
  assert.ok(
    (warnedLines.at(-1) ?? '').trimEnd().endsWith('⚠ appa unreachable'),
    'a notice displaces the sentinel',
  );
  assert.equal(
    (warnedLines.at(-1) ?? '').includes('󰠭'),
    false,
    'no sentinel beside a notice',
  );

  const bare: HeaderDeckState = {
    ...titleFixture({ title: IDLE_TITLE }),
    resources: undefined,
    footerTelemetry: undefined,
    contextPercent: undefined,
    contextTokens: undefined,
    contextWindow: undefined,
    mcp: null,
    lsp: null,
  };
  const bareLines = renderHeaderDeck(bare, 120, plainTheme as never).map(plain);
  assert.ok(
    (bareLines.at(-1) ?? '').trimEnd().endsWith('󰠭'),
    'a bare deck still closes with the sentinel row',
  );
});

test('the clean sentinel wears the short session id between two ladybugs', () => {
  // Ladybug-session-id amendment: only when the ladder is silent and the
  // frame is wide enough — blue bugs (accent), purple id (thinkingHigh);
  // the census grows to three (clock anchor + two cluster bugs).
  const withId = titleFixture({ title: IDLE_TITLE });
  withId.sessionShortId = '01a157fd';
  const lines = renderHeaderDeck(withId, 120, plainTheme as never).map(plain);
  assert.ok(
    (lines.at(-1) ?? '').trimEnd().endsWith('󰠭 01a157fd 󰠭'),
    'the clean right end wears the id cluster',
  );
  assert.equal(
    lines.join('').split('󰠭').length - 1,
    3,
    'census: clock anchor + two cluster bugs',
  );
  const colors: string[] = [];
  renderHeaderDeck(withId, 120, {
    fg: (name: string, text: string) => {
      colors.push(`${name}:${text}`);
      return text;
    },
    bold: (text: string) => text,
  } as never);
  assert.ok(colors.includes('accent:󰠭'), 'the cluster bugs render accent');
  assert.ok(colors.includes('thinkingHigh:01a157fd'), 'the id renders purple');
  assert.ok(!colors.includes('dim:󰠭'), 'the plain dim bug yields to the cluster');

  // No id known: the plain dim sentinel stays exactly as before.
  const withoutId = titleFixture({ title: IDLE_TITLE });
  const plainLines = renderHeaderDeck(withoutId, 120, plainTheme as never).map(plain);
  assert.ok(
    (plainLines.at(-1) ?? '').trimEnd().endsWith('󰠭') &&
      !(plainLines.at(-1) ?? '').includes('01a157fd'),
    'without an id the sentinel stays a single dim bug',
  );

  // Narrow frames degrade to the plain bug rather than crowding the row.
  for (const width of [20, 23]) {
    const narrow = renderHeaderDeck(withId, width, plainTheme as never).map(plain);
    const last = narrow.at(-1) ?? '';
    assert.ok(last.trimEnd().endsWith('󰠭'), String(width));
    assert.equal(last.includes('01a157fd'), false, String(width));
  }
  const wide = renderHeaderDeck(withId, 24, plainTheme as never).map(plain);
  assert.ok(
    (wide.at(-1) ?? '').includes('01a157fd'),
    'the cluster hosts from 24 columns up',
  );

  // A notice still displaces the whole cluster — the id never competes
  // with a speaking ladder.
  const warned = titleFixture({ title: IDLE_TITLE });
  warned.sessionShortId = '01a157fd';
  warned.piStatus = {
    errors: 0,
    warnings: 0,
    nativeStatusCount: 1,
    nativeStatuses: [{ key: 'appa', text: 'appa unreachable' }],
  };
  const warnedLines = renderHeaderDeck(warned, 120, plainTheme as never).map(plain);
  assert.ok(
    (warnedLines.at(-1) ?? '').trimEnd().endsWith('⚠ appa unreachable'),
    'notices still own the slot',
  );
  assert.equal(
    (warnedLines.at(-1) ?? '').includes('01a157fd'),
    false,
    'no id beside a notice',
  );
});

// --- Step 3.1: the unified notice slot --------------------------------------

test('aggregates mixed notices ranked companion, diagnostics', () => {
  const state = titleFixture({ title: IDLE_TITLE });
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
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
  const line4 = lines.at(-1) ?? '';
  // The accepted mixed render, verbatim (spec scenario: appa unreachable,
  // two diagnostics).
  assert.ok(line4.trimEnd().endsWith('⚠ appa unreachable · 2 diagnostics'));
  assert.ok(
    line4.trimEnd().includes('⚠ appa unreachable'),
    'notices own the right end',
  );
});

test('restores blocked and approval signals as companion-group notices', () => {
  const state = titleFixture({ title: IDLE_TITLE });
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    blocked: true,
    approvalRequired: true,
  };

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const line4 = lines.at(-1) ?? '';
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
    .at(-1);
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
  const wide4 = wide.at(-1) ?? '';
  assert.ok(wide4.trimEnd().endsWith('⚠ appa unreachable'));
  assert.ok(wide4.includes('$5.16'), 'machine tail rides beside the notice');

  // The notice rides the same fit ladder as the machine group: it renders
  // only when it fits beside the engine group at full width.
  const fits = renderHeaderDeck(state, 79, plainTheme as never).map(plain);
  assert.ok(
    (fits.at(-1) ?? '').trimEnd().endsWith('⚠ appa unreachable'),
    'notice fits beside the engine group at 79',
  );
  // deck-corner-context: the global group lost context and compaction,
  // so the notice fits beside it at 60 as well.
  const sixty = renderHeaderDeck(state, 60, plainTheme as never).map(plain);
  assert.ok(
    (sixty.at(-1) ?? '').trimEnd().endsWith('⚠ appa unreachable'),
    'notice fits beside the engine group at 60',
  );
  for (const width of [39, 20]) {
    const narrow = renderHeaderDeck(state, width, plainTheme as never);
    // deck-reshape: the status row is standalone — it survives narrow
    // widths while the merged corner yields (identity leads line 1).
    assert.ok(
      plain(narrow.at(-1) ?? '').includes('⚠ appa unreachable'),
      `status row survives at ${width}`,
    );
    assert.ok(
      narrow.every((line) => visibleWidth(line) <= width),
      String(width),
    );
  }
});

test('keeps the notice slot sentinel-only when clean', () => {
  const state = titleFixture({ title: IDLE_TITLE });
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
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
  // Clean: no ⚠ glyph — the dim ladybug sentinel owns the status right
  // end while the calendar rides the engine on line 1.
  assert.equal(lines.join('\n').includes('⚠'), false);
  assert.equal(lines.length, 5, 'engine row stays when clean');
  assert.ok((lines[0] ?? '').includes('63%'), 'calendar rides the engine on line 1');
  assert.ok(
    (lines.at(-1) ?? '').trimEnd().endsWith('󰠭'),
    'the sentinel owns the clean right end',
  );
  const colors: string[] = [];
  renderHeaderDeck(state, 120, {
    fg: (name: string, text: string) => {
      colors.push(`${name}:${text}`);
      return text;
    },
    bold: (text: string) => text,
  } as never);
  assert.equal(colors.includes('dim:healthy'), false, 'text placeholder stays retired');
  assert.ok(colors.includes('dim:󰠭'), 'the sentinel renders dim');
  assert.ok(
    (lines.at(-1) ?? '').includes('48.2%'),
    'machine readings stay on the bottom row',
  );
  // Healthy companion texts never surface as notices.
  assert.equal(lines.join('\n').includes('report available'), false);
});

// --- Step 3.2: waiver suppression -------------------------------------------

function waiverFixture(
  waiver: { id: string; notice: string } | null,
  overrides: {
    nativeStatuses?: Array<{ key: string; text: string }>;
  } = {},
): HeaderDeckState {
  const state = titleFixture({ title: IDLE_TITLE });
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
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
      nativeStatuses: [
        { key: 'graphify', text: noticeText },
        { key: 'appa', text: 'appa unreachable' },
      ],
    },
  );

  const lines = renderHeaderDeck(state, 140, plainTheme as never).map(plain);
  const line4 = lines.at(-1) ?? '';
  // Exactly the waived text leaves the slot; the other notices remain.
  assert.ok(line4.trimEnd().endsWith('⚠ appa unreachable'));
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
  const restoredLine = restoredLines.at(-1) ?? '';
  assert.ok(restoredLine.trimEnd().endsWith(`⚠ ${noticeText}`));
  assert.ok(
    restoredLine.includes('$5.16'),
    'machine tail rides beside the restored notice',
  );
});

test('a waiver matching no live notice text is inert', () => {
  const state = waiverFixture(
    { id: 'stale-waiver', notice: 'engram down' },
    { nativeStatuses: [{ key: 'graphify', text: 'graphify · update recommended' }] },
  );

  const lines = renderHeaderDeck(state, 140, plainTheme as never).map(plain);
  const line4 = lines.at(-1) ?? '';
  // Exact-text matching: a waiver for a notice that is not live suppresses
  // nothing — the live companion warning still renders.
  assert.ok(line4.trimEnd().endsWith('⚠ graphify · update recommended'));
});
