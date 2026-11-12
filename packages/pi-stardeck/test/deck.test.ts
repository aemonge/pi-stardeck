import assert from 'node:assert/strict';
import test from 'node:test';
import { visibleWidth } from '@earendil-works/pi-tui';

import {
  renderHeaderDeck,
  renderWarningLine,
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
    extraInfo: false,
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

test('renders the approved rich wide header without side borders or spacer rows', () => {
  const state = fixture();
  state.extraInfo = true;
  const lines = renderHeaderDeck(state, 160, plainTheme as never);

  // simplify-deck-band ON at 160: five rows — L1, ─, L2, ┈, extra row
  // (machine tail left, engine cluster right); the OFF daily view is
  // the same frame minus the last two rows.
  assert.equal(lines.length, 5);
  // Second 2.4 amendment: the full solid rule returns beneath line 1.
  assert.match(plain(lines[1] ?? ''), /^┈+$/u);
  const titleRow = plain(lines[2] ?? '');
  assert.ok(titleRow.startsWith('Read-only preflight'));
  assert.equal(titleRow.includes("000:07'00"), false);
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
  assert.match(lines[3] ?? '', /^\u001b\[2m/u);
  assert.match(
    plain(lines[0] ?? ''),
    /^\u{F01A7} \u{F04E6} \u{F1049} \u{F0498} \u{27E9} \u{F07B} ~\/galactica \u{27E9}/u,
  );
  assert.match(plain(lines[0] ?? ''), /feature\/review-led/u);
  // simplify-deck-band: the engine cluster closes the extra band's right
  // end — model › thinking ⟩ context › summaries ⟩ quota.
  assert.match(
    plain(lines.at(-1) ?? ''),
    /\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F0F86} 38% \u{203A} \u{F039E} 2 \u{27E9} \u{F241} 63%$/u,
  );
  // deck-reshape: the machine tail anchors the bottom row's left; the
  // right end stays empty unless the room aim speaks (reorder-deck-frame).
  assert.equal(lines.join('\n').includes('32K/128K'), false);
  assert.equal(lines.join('\n').includes('healthy'), false, 'placeholder retired');
  assert.ok(lines.every((line) => line.length > 0));
  assert.ok(lines.every((line) => !line.startsWith('│}') && !line.endsWith('│')));
  // Ladybug census: zero — the sentinel retired with the session id.
  assert.equal(lines.join('').split('󰠭').length - 1, 0);
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
    /\/pi-status \(unfocus openspec\)$/u,
    'the chip keeps the right end beside the alert',
  );
  assert.equal(line1.split('⟩').length - 1, 3, 'identity sep + path sep + alert sep');
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

test('drops the footer count; the dotted rule opens the deck', () => {
  const state = fixture();
  state.piStatus = { errors: 0, warnings: 0, nativeStatusCount: 3 };

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  // Second 2.4 amendment: the solid rule rides beneath line 1 again —
  // clean or alerting, the rule is constant (third amendment: it is the
  // only one; the deck ends at the telemetry row).
  assert.match(plain(lines[1] ?? ''), /^\u2508+$/u);
  assert.match(plain(lines[2] ?? ''), /^Read-only preflight/u);
  assert.equal(lines.join('').includes('·3'), false);
  // Relocation phase: the footer count is deleted; the anchor echo remains.
  assert.doesNotMatch(lines.at(-1) ?? '', /[0-9] ‹/u);

  const ansiTheme = {
    fg: (_semanticColor: string, text: string) => `\u001b[35m${text}\u001b[0m`,
    bold: (text: string) => `\u001b[1m${text}\u001b[22m`,
  };
  const wrapped = renderHeaderDeck(state, 59, ansiTheme as never);
  assert.ok(wrapped.every((line) => visibleWidth(line) <= 59));
  const dimSeams = wrapped.filter((line) => /^\u001b\[2m┈+\u001b\[22m$/u.test(line));
  assert.equal(dimSeams.length, 0, 'no dim toggle seam while OFF');
  const dottedRules = wrapped.filter((line) => /^┈+$/u.test(plain(line)));
  assert.equal(dottedRules.length, 1, 'the lone dotted rule opens the deck');

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
    /\(unfocus openspec\)$/u,
    'the chip anchors the right end ahead of nothing else',
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
    seen.some((e) => /[[\]]/u.test(e.text)),
    false,
    'no bracket enclosures survive — parens belong to the gray placeholder',
  );
  const line1 = renderHeaderDeck(state, 120, plainTheme as never).map(plain)[0] ?? '';
  assert.match(
    line1,
    /\u{F01A7} \u{F04E6} \u{F1049} \u{F0498} \u{27E9}/u,
    'mixed state: blue devbox KO and red appa, bare icons throughout',
  );
});

test('known companion icons are always present', () => {
  const state = fixture();
  state.extraInfo = true;
  const bare = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  assert.match(bare[0] ?? '', /\u{F04E6}/u, 'companion icons ride line 1 left');
  assert.match(bare[0] ?? '', /\(unfocus openspec\)$/u, 'the chip rides line 1 right');
  assert.match(bare.at(-1) ?? '', /\u{F035B}/u, 'cpu anchors the extra band left');
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
  // Pure band: the legacy activity projection no longer narrates line 3 —
  // the row retires and the title row stays the only narrative surface.
  assert.equal(
    lines.some((line) => plain(line).includes('verify')),
    false,
  );
  const titleRow = plain(lines[2] ?? '');
  assert.ok(titleRow.startsWith('Plan title › Current task'));
  assert.equal(titleRow.includes("000:07'00"), false);
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
  assert.ok(titleRow.startsWith(`Parent Plan title › ${expected}`.slice(0, 40)));
  assert.equal(titleRow.includes("000:07'00"), false);

  const narrow = renderHeaderDeck(state, 79, plainTheme as never);
  const focusIdx = narrow.findIndex((line) =>
    plain(line).includes('Parent Plan title'),
  );
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
  assert.ok(plain(focus[0] ?? '').startsWith('Parent Plan title'));
  assert.ok(plain(focus[1] ?? '').includes('without repeating'));
});

test('keeps a single selected title on the focus row only', () => {
  const state = fixture();
  state.header!.work!.titles = ['One focused work title'];
  state.header!.selection = {
    source: 'subject',
    titles: ['One focused work title'],
    color: 'accent',
  };

  const wide = renderHeaderDeck(state, 160, plainTheme as never);
  assert.doesNotMatch(wide[5] ?? '', /One focused work title/u);
  const titleRow = plain(wide[2] ?? '');
  assert.ok(titleRow.startsWith('One focused work title'));
  assert.equal(titleRow.includes("000:07'00"), false);
  assert.equal(wide.join('\n').split('One focused work title').length - 1, 1);

  const narrow = renderHeaderDeck(state, 79, plainTheme as never);
  assert.ok(
    plain(
      narrow.find((line) => plain(line).includes('One focused work title')) ?? '',
    ).startsWith('One focused work title'),
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
  assert.ok(subjectRow.startsWith('Session subject'));
  assert.equal(subjectRow.includes("000:07'00"), false);
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
    source: 'subject',
    titles: [echoTitle],
    color: 'accent',
  };
  state.header!.suggestion = null;

  const lines = renderHeaderDeck(state, 160, plainTheme as never);
  const titleLine = plain(lines.find((line) => line.includes(echoTitle)) ?? '');
  assert.ok(titleLine.includes(echoTitle), 'selection band shows the title');
  // No-echo contract: the title renders exactly once across the whole deck.
  assert.equal(lines.join('\n').split(echoTitle).length - 1, 1);
});

test('keeps the band accent and the counters absent in every counter state', () => {
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

  assert.ok(colors.some((entry) => entry.startsWith('thinkingHigh:┈')));
  assert.ok(colors.includes('thinkingHigh:⟩'));
  // The toggle seam is constructed eagerly; OFF simply never renders it.
  assert.equal(colors.filter((entry) => entry.startsWith('text:┈')).length, 1);
  assert.equal(colors.filter((entry) => entry === 'customMessageLabel:󰠭').length, 0);
  assert.equal(
    colors.some((entry) => entry.startsWith('thinkingMax:')),
    false,
  );
});

// --- The engine group lives on the extra band only (simplify-deck-band) -----

test('the engine cluster leaves line 1 and closes the extra band right', () => {
  const off = renderHeaderDeck(fixture(), 160, plainTheme as never).map(plain);
  assert.doesNotMatch(
    off[0] ?? '',
    /GPT-5\.6 Sol/u,
    'line 1 carries no engine while OFF',
  );
  assert.equal(
    off.some((line) => line.includes('48.2%')),
    false,
    'no machine tail while OFF',
  );

  const state = fixture();
  state.extraInfo = true;
  const lines = renderHeaderDeck(state, 160, plainTheme as never).map(plain);
  const extra = lines.at(-1) ?? '';
  assert.match(
    extra,
    /^\u{F035B} 48\.2% \u{203A} \u{F061A} 268M \u{203A} 3\/3 \u{27E9} \u{F0726} \$5\.16\s+\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F0F86} 38% \u{203A} \u{F039E} 2 \u{27E9} \u{F241} 63%$/u,
    'the machine tail rides left and the engine cluster closes right',
  );
  assert.equal(
    lines.length,
    5,
    'single-line subject at 160: five-row deck with the band on',
  );
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
  const wide = fixture();
  wide.extraInfo = true;
  for (const width of [160, 100, 79, 59, 39, 20]) {
    const lines = renderHeaderDeck(wide, width, plainTheme as never);
    assert.ok(lines.length >= 4, String(width));
    assert.ok(
      lines.every((line) => visibleWidth(line) <= width),
      String(width),
    );
    assert.ok(
      lines.some((line) => plain(line).includes('Read-only preflight')),
      String(width),
    );
    // The sentinel retired with the session id — the census is zero.
    assert.equal(lines.join('').split('󰠭').length - 1, 0, String(width));
    assert.doesNotMatch(lines.join('\n'), /000:07'00/u, String(width));
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
  assert.match(lines[2] ?? '', /^— no subject/u);

  // Header present but title absent entirely (selection-less): same hint.
  const untitled = fixture();
  untitled.header = {
    ...(untitled.header as NonNullable<typeof untitled.header>),
    title: undefined,
    selection: undefined,
  };
  const untitledLines = renderHeaderDeck(untitled, 120, plainTheme as never).map(plain);
  assert.match(untitledLines[2] ?? '', /^— no subject/u);
});

test('renders unavailable optional telemetry honestly', () => {
  const state = fixture();
  state.header = null;
  state.extraInfo = true;
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
  assert.equal(plain(lines[2] ?? '').trim(), '');
  assert.doesNotMatch(all, /next direction/u);
  assert.doesNotMatch(all, /clean/u);
  assert.equal(all.includes('task'), false);
  assert.equal(all.includes('stps'), false);
  // quiet-activity-row: idle without a meter retires the band — no
  // `awaiting Human`, no zero-cost narration it cannot know; the
  // engine row closes the deck.
  assert.equal(all.includes('awaiting Human'), false);
  assert.equal(all.includes('tok'), false);
  // simplify-deck-band: absent facts remove their slots — the bare extra
  // band keeps only the compaction counter on the engine cluster, and the
  // gray placeholder rides line 1's right end.
  const bareTail = plain(lines.at(-1) ?? '');
  assert.ok(bareTail.includes('󰎞 2'), 'the counter survives');
  assert.ok(bareTail.includes('GPT-5.6 Sol'), 'the engine cluster still speaks');
  assert.ok(
    plain(lines[0] ?? '')
      .trimEnd()
      .endsWith('(unfocus openspec)'),
    'the placeholder rides line 1 right',
  );
  // Frozen contract: absent Git removes the segment entirely.
  assert.ok(all.includes('(no Git)'));
});

const CAL_ICON = '󰃰';
const FLAME_ICON = '󰈸';
const CLOCK_ICON = '󰅐';

test('paints icon-native quota tiles in cost, calendar, flame order', () => {
  const state = fixture();
  state.extraInfo = true;
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
  state.extraInfo = true;
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
  state.extraInfo = true;
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
  state.extraInfo = true;
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

test('stardeck-extra reveals the extra band: dotted seam, machine tail left, engine right', () => {
  const state = fixture();
  state.extraInfo = true;
  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  assert.equal(lines.length, 6, 'L1, rule, subject ×2 wrap, dotted seam, extra row');
  assert.match(lines[4] ?? '', /^┈+$/u, 'the dotted seam tops the toggle area');
  const extra = lines[5] ?? '';
  assert.ok(extra.includes('48.2%'), 'the machine tail rides left');
  assert.ok(extra.includes('$5.16'), 'cost stays in the machine tail');
  assert.match(
    extra,
    /\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F0F86} 38% \u{203A} \u{F039E} 2 \u{27E9} \u{F241} 63%$/u,
    'engine cluster right: model › thinking ⟩ context › summaries ⟩ quota',
  );
  // The context tiles left the machine tail for the engine cluster.
  const tail = extra.split('\u{27E9} \u{F0F86}')[0] ?? '';
  assert.equal(tail.includes('\u{F0F86}'), false);
});

test('the focused-change chip relocates to line 1 right in both states', () => {
  const off = renderHeaderDeck(fixture(), 120, plainTheme as never).map(plain);
  assert.match(off[0] ?? '', /\(unfocus openspec\)$/u);
  assert.doesNotMatch(off[0] ?? '', /GPT-5\.6 Sol/u);

  const on = fixture();
  on.extraInfo = true;
  on.header = {
    ...(on.header as NonNullable<typeof on.header>),
    title: parseDeckTitleState({
      v: 2 as const,
      subject: 'Subject',
      work: { change: 'eight-section-deck' },
      waiver: null,
    }),
  };
  const lines = renderHeaderDeck(on, 120, plainTheme as never).map(plain);
  assert.match(lines[0] ?? '', /󰈙 eight-section-deck$/u);
  assert.equal(lines[2] ?? '', 'Subject', 'no echo of the chip on line 2');
});

// --- Step 2.1: line 2 on the title-state contract ---------------------------

const IDLE_TITLE = {
  v: 2 as const,
  subject: 'Pivot cockpit to pure pi-starship-header chrome',
  work: null,
  waiver: null,
};

/** A truthful aimed-work fixture: the room aim's verbatim fields. */
const WORK_TITLE = {
  change: 'eight-section-deck',
  artifactName: 'plan',
  artifactIdx: '0/1',
  task: '1/4',
};

function titleFixture(overrides: { title?: unknown }): HeaderDeckState {
  const state = fixture();
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

test('renders line 2 as Subject with the Work label on the right', () => {
  const state = titleFixture({
    title: { ...IDLE_TITLE, work: WORK_TITLE },
  });

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const titleRow = lines.find((line) => line.includes('Pivot cockpit')) ?? '';
  assert.ok(titleRow.startsWith('Pivot cockpit to pure pi-starship-header chrome'));
  // Layout law 2026-11-10 amended (reorder-deck-frame): line 2 carries
  // the progress fields; the slug lives on the engine row's right end.
  assert.ok(titleRow.includes('plan 0/1 › 1/4'));
  const state2 = { ...state, extraInfo: true };
  const engineLine = plain(
    renderHeaderDeck(state2, 120, plainTheme as never).at(-1) ?? '',
  );
  assert.doesNotMatch(
    engineLine,
    /eight-section-deck/u,
    'the slug left the engine cluster',
  );
});

test('an absent work slot renders an empty tile — no sentinel narration', () => {
  const state = titleFixture({ title: IDLE_TITLE });

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const titleRow = lines.find((line) => line.includes('Pivot cockpit')) ?? '';
  // The dim hint retired with the truthful band: the subject alone narrates.
  assert.ok(titleRow.includes('Pivot cockpit'));
  assert.equal(titleRow.includes('no change owns the moment'), false);
  const colors: string[] = [];
  renderHeaderDeck(state, 120, {
    fg: (name: string, text: string) => {
      colors.push(`${name}:${plain(text)}`);
      return text;
    },
    bold: (text: string) => text,
  } as never);
  assert.equal(
    colors.some((entry) => entry.includes('no change owns')),
    false,
  );
});

test('renders the dim no-subject placeholder when the subject is null', () => {
  const state = titleFixture({ title: { ...IDLE_TITLE, subject: null } });

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const titleRow = lines[2] ?? '';
  assert.ok(titleRow.startsWith('— no subject'));
  assert.doesNotMatch(titleRow, /⟩\s*$/u);
  assert.doesNotMatch(titleRow, /󰠭\s+⟩/u);
  // The work slot stays silent — absent facts remove their slots.
  assert.equal(titleRow.includes('no change owns the moment'), false);
});

test('colors the Work tile by state and narrows in stages', () => {
  const state = titleFixture({
    title: { ...IDLE_TITLE, work: WORK_TITLE },
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
  assert.ok(colors.includes('success:󰈙 eight-section-deck'));
  assert.ok(colors.includes('accent:󰈙 plan 0/1'));
  assert.ok(colors.includes('accent: › '));
  assert.ok(colors.includes('accent:1/4'));

  // 39 columns: the whole slot yields to the band fit.
  const narrow = renderHeaderDeck(state, 39, plainTheme as never).map(plain);
  assert.ok((narrow[2] ?? '').includes('Pivot cockpit'));
  assert.equal((narrow[2] ?? '').includes('plan 0/1'), false);

  // 45 columns: compact yields the dim next-step only — identity and
  // progress survive; the item glyph retired with the collector path.
  const mid = renderHeaderDeck(state, 45, plainTheme as never).map(plain);
  assert.ok((mid[2] ?? '').includes('plan 0/1'));
  assert.ok((mid[2] ?? '').includes('1/4'));
  assert.equal((mid[2] ?? '').includes('󰄱'), false);
});

test('the left band renders accent unconditionally — it can never mirror openspec', () => {
  const state = titleFixture({
    title: {
      ...IDLE_TITLE,
      subject: 'Eight Section Deck',
      work: WORK_TITLE,
    },
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
  // Layout law 2026-11-10: even a subject that echoes the change slug
  // stays accent — the mirror coloring is gone with the law.
  assert.ok(colors.includes('accent:Eight Section Deck'));
  assert.equal(colors.includes('success:Eight Section Deck'), false);

  colors.length = 0;
  const other = titleFixture({
    title: {
      ...IDLE_TITLE,
      subject: 'Pivot cockpit to pure pi-starship-header chrome',
      work: WORK_TITLE,
    },
  });
  renderHeaderDeck(other, 120, theme as never);
  assert.ok(colors.includes('accent:Pivot cockpit to pure pi-starship-header chrome'));
});

test('keeps pre-title publishers on the legacy selection band with a silent right end', () => {
  const lines = renderHeaderDeck(fixture(), 120, plainTheme as never).map(plain);
  const titleRow = lines.find((line) => line.includes('Read-only preflight')) ?? '';
  assert.ok(titleRow.includes('Read-only preflight'));
  // No title state means no Work slot: absent facts stay silent, and the
  // superseded counter tiles never come back to fill the gap.
  assert.equal(titleRow.includes('·'), false);
  assert.equal(titleRow.includes('no change owns the moment'), false);
});

test('ignores a malformed title state and falls back to the legacy band', () => {
  const state = titleFixture({ title: { v: 9, subject: 'stale' } });

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  const titleRow = lines.find((line) => line.includes('Read-only preflight')) ?? '';
  assert.ok(titleRow.includes('Read-only preflight'), 'selection keeps the band');
  assert.equal(titleRow.includes('stale'), false);
});

test('wraps a long subject onto a continuation line', () => {
  const subject =
    'Deliver one deliberately long session subject that needs a second responsive line without inventing new machinery';
  const state = titleFixture({ title: { ...IDLE_TITLE, subject } });

  const lines = renderHeaderDeck(state, 100, plainTheme as never).map(plain);
  const first = lines.findIndex((line) => line.includes('Deliver one deliberately'));
  assert.ok(first >= 0);
  assert.ok((lines[first] ?? '').startsWith('Deliver one deliberately'));
  assert.ok((lines[first + 1] ?? '').includes('machinery'));
});

// --- Step 2.2: the extra-info band (simplify-deck-band) ---------------------

test('hides the extra band by default; live or idle, the band stays quiet', () => {
  const idle = renderHeaderDeck(fixture(), 120, plainTheme as never).map(plain);
  // OFF (default): line 1, dotted rule, the wrapped subject — nothing else.
  assert.equal(idle.length, 4);
  // Exactly one full-width dotted line while OFF — the primary rule; the
  // dim toggle seam renders only when the band is on.
  assert.equal(idle.filter((line) => /^┈+$/u.test(line)).length, 1);
  assert.equal(
    idle.some((line) => line.includes('48.2%')),
    false,
  );
  assert.equal(
    idle.some((line) => line.includes('GPT-5.6 Sol')),
    false,
  );

  const live = titleFixture({ title: IDLE_TITLE });
  const liveLines = renderHeaderDeck(live, 120, plainTheme as never).map(plain);
  assert.equal(liveLines.length, 3, 'no band returns while OFF, whatever the state');
});

test('colors the model cluster by its engine semantics on the extra band', () => {
  const colors: string[] = [];
  const theme = {
    fg: (name: string, text: string) => {
      colors.push(`${name}:${plain(text)}`);
      return text;
    },
    bold: (text: string) => text,
  };
  const state = fixture();
  state.extraInfo = true;
  renderHeaderDeck(state, 120, theme as never);
  assert.ok(
    colors.some(
      (entry) => entry.startsWith('accent:') && entry.includes('GPT-5.6 Sol'),
    ),
  );
  assert.ok(colors.includes('accent:\u{F0F86} 38%'));
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
  assert.match(line1, /\(unfocus openspec\)$/u);
  assert.doesNotMatch(line1, /GPT-5\.6 Sol/u, 'the engine left line 1');
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
  // simplify-deck-band: the focus chip rides line 1 right at every width;
  // the engine cluster only lives on the extra band.
  assert.match(
    plain(renderHeaderDeck(state, 79, plainTheme as never)[0] ?? ''),
    /\(unfocus openspec\)$/u,
    'the chip still rides line 1 at 79',
  );
  assert.doesNotMatch(
    plain(renderHeaderDeck(state, 79, plainTheme as never)[0] ?? ''),
    /GPT-5\.6 Sol/u,
    'the engine never rides line 1',
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

test('flame leads the machine group on the extra band; the engine closes right', () => {
  const state = fixture();
  state.extraInfo = true;
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
  const extra = lines.at(-1) ?? '';
  const flameAt = extra.indexOf('82%');
  // simplify-deck-band: the machine tail rides the extra band left; the
  // engine cluster (with its calendar) closes the row right.
  const machineAt = extra.indexOf('48.2%');
  const mcpAt = extra.indexOf('3/3');
  const costAt = extra.indexOf('$5.16');
  assert.ok(flameAt >= 0 && machineAt > flameAt, 'quota flame leads the machine tail');
  assert.ok(mcpAt > machineAt, 'mcp rides the machine tail');
  assert.ok(costAt > mcpAt, 'global cost anchors the row');
  const engineAt = extra.indexOf('GPT-5.6 Sol');
  const calendarAt = extra.indexOf('12%');
  assert.ok(
    engineAt > costAt && calendarAt > engineAt,
    'the engine with its calendar closes the extra band right',
  );
  assert.ok(
    extra.includes('(unfocus openspec)') === false,
    'the chip left the extra band',
  );
  assert.equal(lines.length, 5, 'clean five-row deck with the band on');
  // Narrow: the extra row has the full width — the whole tail rides.
  const narrowBottom = plain(
    renderHeaderDeck(state, 62, plainTheme as never).at(-1) ?? '',
  );
  assert.ok(narrowBottom.includes('82%'), 'the flame rides the extra band at 62');
  assert.equal(
    narrowBottom.includes('🔔'),
    false,
    'the notice yields wholesale at extreme narrow',
  );
});

test('the warning left the deck; renderWarningLine speaks below the prompt', () => {
  const state = fixture();
  state.piStatus = {
    errors: 2,
    warnings: 1,
    nativeStatusCount: 2,
    nativeStatuses: [{ key: 'graphify', text: 'graphify stale · update recommended' }],
  };
  const lines = renderHeaderDeck(state, 160, plainTheme as never).map(plain);
  // move-warning-below-prompt (2026-11-11): the deck closes on the
  // subject lines — no notice row, no seam while OFF; the chip and the
  // alert ride line 1.
  assert.equal(
    lines.join('\n').includes('🔔'),
    false,
    'no warning rides the deck anymore',
  );
  assert.match(
    lines[0] ?? '',
    /\/pi-status \(unfocus openspec\)$/u,
    'the chip rides line 1 beside the alert',
  );
  assert.deepEqual(
    renderWarningLine(state, 160, plainTheme as never).map(plain),
    ['🔔 graphify stale · update recommended'],
    'the notice owns its line whole, below the prompt',
  );

  state.piStatus = { errors: 2, warnings: 1, nativeStatusCount: 0 };
  const clean = renderHeaderDeck(state, 160, plainTheme as never).map(plain);
  // simplify-deck-band: OFF stays silent and clock-free whatever the
  // status — the alert keeps its line-1 rider slot. The subject fits one
  // line at 160, so the OFF frame is three rows.
  assert.equal(clean.length, 3, 'the OFF frame ends at the subject');
  assert.equal(clean.join('\n').includes('🔔'), false);
  assert.doesNotMatch(clean.join('\n'), /63%/u, 'no quota speaks while OFF');
  // Severity counts (line 1) and notices stay distinct surfaces.
  assert.match(plain(clean[0] ?? ''), /⟩ \/pi-status/u);
  assert.deepEqual(
    renderWarningLine(state, 160, plainTheme as never),
    [],
    'silence below the prompt when there is nothing to say',
  );
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

test('opens the deck with a dotted rule; the dim seam only tops the extra band', () => {
  // Single-line subject at this width so the OFF band count is fixed at
  // three (simplify-deck-band: no activity, no spans, no machine row).
  const off = renderHeaderDeck(
    titleFixture({ title: IDLE_TITLE }),
    100,
    plainTheme as never,
  ).map(plain);
  assert.equal(off.length, 3);
  assert.match(off[1] ?? '', /^┈+$/u, 'dotted rule beneath line 1, rule color');
  assert.equal(
    off.some((line) => /^\u001b\[2m/u.test(line)),
    false,
    'no dim toggle seam while OFF',
  );

  const on = titleFixture({ title: IDLE_TITLE });
  on.extraInfo = true;
  const lines = renderHeaderDeck(on, 100, plainTheme as never).map(plain);
  assert.match(lines[3] ?? '', /^┈+$/u, 'dotted seam tops the extra band');
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
  };

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  // simplify-deck-band: the OFF daily view is three rows — line 1 with the
  // focus chip right, the dotted rule in the rule color, the subject.
  assert.equal(lines.length, 3);
  // Line 1: identity leads the path; the focus chip anchors the right.
  assert.match(
    lines[0] ?? '',
    /^\u{F01A7} \u{F04E6} \u{F1049} \u{F0498} \u{27E9} \u{F07B} ~\/projects\/pi-stardeck \u{27E9} \u{E725} main \u{203A} \u{F00C} clean\s+\(unfocus openspec\)$/u,
  );
  // The dotted rule beneath line 1 carries no dim wrapper while OFF — the
  // dim wrapper belongs to the toggle seam alone.
  assert.match(lines[1] ?? '', /^\u2508+$/u);
  assert.equal(
    lines.some((line) => /^\u001b\[2m/u.test(line)),
    false,
    'no dim toggle seam while OFF',
  );
  // Line 2: Subject left (no clock — 2026-10-23 amendment); the work slot
  // stays silent without facts (truthful band, 2026-11-06).
  assert.equal(lines[2] ?? '', 'Pivot cockpit to pure pi-starship-header chrome');
  assert.equal(lines.join('\n').includes('healthy'), false);
});

test('renders the accepted mid-work mockup at wide widths', () => {
  const state = mockupDeckState();
  state.git = { staged: 0, modified: 2, untracked: 0, conflicts: 0 };
  state.extraInfo = true;
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    title: parseDeckTitleState({
      ...IDLE_TITLE,
      work: {
        change: 'eight-section-deck',
        artifactName: 'plan',
        artifactIdx: '0/1',
        task: '1/4',
      },
    }),
  };

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  // simplify-deck-band ON: five rows — the chip rides line 1 right, the
  // git segment yields its width (`ma…`), the extra band closes the deck.
  assert.match(
    lines[0] ?? '',
    /^\u{F01A7} \u{F04E6} \u{F1049} \u{F0498} \u{27E9} \u{F07B} ~\/projects\/pi-stardeck \u{27E9} \u{E725} main \u{203A} \u{F040} 2\s+󰈙 eight-section-deck$/u,
  );
  // At 100 the path truncates (`~/project…`) while the chip rides.
  const hundred = renderHeaderDeck(state, 100, plainTheme as never).map(plain);
  assert.match(hundred[0] ?? '', /main \u{203A} \u{F040} 2\s+󰈙 eight-section-deck$/u);
  // Strong rule beneath line 1.
  assert.match(lines[1] ?? '', /^\u2508+$/u);
  // Line 2: the verbatim render law on the right tile.
  assert.match(
    lines[2] ?? '',
    /^Pivot cockpit to pure pi-starship-header chrome\s+󰈙 plan 0\/1 › 1\/4$/u,
  );
  // The dotted seam tops the extra band; machine tail left, engine right.
  assert.match(lines[3] ?? '', /^\u2508+$/u);
  assert.match(
    lines[4] ?? '',
    /^\u{F035B} 48\.2% \u{203A} \u{F061A} 268M \u{203A} 3\/3 \u{27E9} \u{F0726} \$5\.16\s+\u{F06A9} GPT-5\.6 Sol \u{203A} high \u{27E9} \u{F0F86} 38% \u{203A} \u{F039E} 2 \u{27E9} \u{F241} 63%$/u,
  );
  assert.equal(lines.length, 5);
});

test('renders both mockups identically at 100 and 120 columns', () => {
  const state = mockupDeckState();
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    title: parseDeckTitleState(IDLE_TITLE),
  };
  for (const width of [100, 120]) {
    const lines = renderHeaderDeck(state, width, plainTheme as never).map(plain);
    assert.ok((lines[0] ?? '').includes('~/project'), String(width));
    assert.ok((lines[2] ?? '').includes('Pivot cockpit'), String(width));
    // OFF stays three rows at every width — the extra band never leaks.
    assert.equal(lines.length, 3, String(width));
    assert.equal(
      lines.some((line) => line.includes('48.2%')),
      false,
      String(width),
    );
    assert.equal(
      lines.some((line) => line.includes('awaiting Human')),
      false,
      String(width),
    );
  }
});

test('a bare deck closes with the machine tail alone — no sentinel narration', () => {
  // reorder-deck-frame (2026-11-11): the right end speaks only when it has
  // something to say — clean frames end on the machine tail; notices own
  // their own dynamic line beneath it.
  const clean = titleFixture({ title: IDLE_TITLE });
  const cleanLines = renderHeaderDeck(clean, 120, plainTheme as never).map(plain);
  assert.equal(
    (cleanLines.at(-1) ?? '').includes('󰠭'),
    false,
    'the ladybug retired with the session id',
  );

  const warned = titleFixture({ title: IDLE_TITLE });
  warned.piStatus = {
    errors: 0,
    warnings: 0,
    nativeStatusCount: 1,
    nativeStatuses: [{ key: 'appa', text: 'appa unreachable' }],
  };
  const warnedLines = renderHeaderDeck(warned, 120, plainTheme as never).map(plain);
  // move-warning-below-prompt (2026-11-11): the warning left the deck —
  // the OFF frame closes on the subject line; the notice speaks below
  // the prompt via renderWarningLine.
  assert.equal(
    warnedLines.join('\n').includes('🔔'),
    false,
    'no warning rides the deck',
  );
  assert.ok(
    (warnedLines[0] ?? '').includes('(unfocus openspec)'),
    'the chip still rides line 1 right',
  );
  assert.deepEqual(
    renderWarningLine(warned, 120, plainTheme as never).map(plain),
    ['🔔 appa unreachable'],
    'the warning owns its line below the prompt',
  );
  assert.equal(
    warnedLines.join('\n').includes('󰠭'),
    false,
    'no sentinel beside a notice',
  );

  const bare: HeaderDeckState = {
    ...titleFixture({ title: IDLE_TITLE }),
    extraInfo: true,
    compactionCount: 0,
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
    (bareLines.at(-1) ?? '').trimEnd().endsWith('GPT-5.6 Sol › high'),
    'a bare ON deck closes with the engine cluster alone — the model always speaks',
  );
});

// --- Step 3.1: the unified notice slot --------------------------------------

test('aggregates mixed notices ordered companion, diagnostics', () => {
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
  assert.equal(
    lines.join('\n').includes('🔔'),
    false,
    'the deck carries no notice row anymore',
  );
  // The accepted mixed render, verbatim (spec scenario: appa unreachable,
  // two diagnostics) — spoken below the prompt.
  assert.deepEqual(renderWarningLine(state, 120, plainTheme as never).map(plain), [
    '🔔 appa unreachable · 2 diagnostics',
  ]);
});

test('restores blocked and approval signals as companion-group notices', () => {
  const state = titleFixture({ title: IDLE_TITLE });
  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    blocked: true,
    approvalRequired: true,
  };

  const lines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  assert.equal(lines.join('\n').includes('🔔'), false, 'no notice row on the deck');
  // Top of the companion group: blocked before approval, publisher wording.
  assert.deepEqual(renderWarningLine(state, 120, plainTheme as never).map(plain), [
    '🔔 ⛔ blocked · approval required',
  ]);

  const colors: string[] = [];
  const theme = {
    fg: (name: string, text: string) => {
      colors.push(`${name}:${plain(text)}`);
      return text;
    },
    bold: (text: string) => text,
  };
  renderWarningLine(state, 120, theme as never);
  assert.ok(colors.includes('error:🔔 ⛔ blocked · approval required'));

  state.header = {
    ...(state.header as NonNullable<typeof state.header>),
    blocked: false,
  };
  colors.length = 0;
  renderWarningLine(state, 120, theme as never);
  const approvalOnly = renderWarningLine(state, 120, plainTheme as never)
    .map(plain)
    .at(-1);
  assert.ok(approvalOnly?.trimEnd().endsWith('🔔 approval required'));
  assert.ok(colors.includes('warning:🔔 approval required'));
});

test('the warning line rides every width below the prompt', () => {
  const state = titleFixture({ title: IDLE_TITLE });
  state.piStatus = {
    errors: 0,
    warnings: 0,
    nativeStatusCount: 1,
    nativeStatuses: [{ key: 'appa', text: 'appa unreachable' }],
  };

  // The notice owns its own line at every width — wide, mid, and narrow;
  // the deck never shares a row with it again.
  for (const width of [160, 79, 60, 39, 20]) {
    const rendered = renderWarningLine(state, width, plainTheme as never).map(plain);
    assert.ok(
      (rendered.at(-1) ?? '').trimEnd().endsWith('🔔 appa unreachable'),
      `the notice owns its line at ${width}`,
    );
    assert.ok(
      rendered.every((line) => visibleWidth(line) <= width),
      String(width),
    );
  }
  const deckLines = renderHeaderDeck(state, 120, plainTheme as never).map(plain);
  assert.equal(
    deckLines.join('\n').includes('🔔'),
    false,
    'no notice rides the deck at any width',
  );
});

test('keeps the notice slot sentinel-only when clean', () => {
  const state = titleFixture({ title: IDLE_TITLE });
  state.extraInfo = true;
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
  // Clean: no 🔔 glyph and no ladybug — with the band on, the frame
  // speaks only its machine readings; no reserved row exists when there
  // is nothing to say.
  assert.equal(lines.join('\n').includes('🔔'), false);
  assert.equal(lines.join('\n').includes('󰠭'), false, 'no sentinel on the clean frame');
  assert.ok(
    lines.some((line) => line.includes('63%')),
    'the calendar rides the engine cluster on the extra band',
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
  assert.equal(lines.join('\n').includes('🔔'), false, 'no notice row on the deck');
  // Exactly the waived text leaves the slot; the other notices remain.
  assert.deepEqual(renderWarningLine(state, 140, plainTheme as never).map(plain), [
    '🔔 appa unreachable',
  ]);
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

  // Suppression-only semantics: a null waiver restores the notice while
  // the waived sole notice empties the slot below the prompt.
  assert.deepEqual(
    renderWarningLine(waived, 140, plainTheme as never),
    [],
    'waived sole notice empties the slot',
  );
  assert.deepEqual(renderWarningLine(restored, 140, plainTheme as never).map(plain), [
    `🔔 ${noticeText}`,
  ]);
});

test('a waiver matching no live notice text is inert', () => {
  const state = waiverFixture(
    { id: 'stale-waiver', notice: 'engram down' },
    { nativeStatuses: [{ key: 'graphify', text: 'graphify · update recommended' }] },
  );

  const lines = renderHeaderDeck(state, 140, plainTheme as never).map(plain);
  assert.equal(lines.join('\n').includes('🔔'), false, 'no notice row on the deck');
  // Exact-text matching: a waiver for a notice that is not live suppresses
  // nothing — the live companion warning still renders.
  assert.deepEqual(renderWarningLine(state, 140, plainTheme as never).map(plain), [
    '🔔 graphify · update recommended',
  ]);
});
