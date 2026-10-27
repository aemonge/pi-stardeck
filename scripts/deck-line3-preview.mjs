#!/usr/bin/env node
// Preview (not packed — scripts/ ships in neither tarball nor package):
// renders the line-3 activity lane after the 2026-10-24 amendments so
// the Human can validate both in one glance:
//
//   1. the turn timer wears the deck chronometer shape `mmm:ss'cc`
//      (002:39'47 — was 2:39)
//   2. subagent/bash labels crop at the real render width, no longer
//      pre-cut at 48 characters (cap now 120, producer and parser)
//
//   node --import tsx/esm scripts/deck-line3-preview.mjs
//
// Colors are 16-color approximations of the deck's theme slots; judge
// layout and crop points, not exact shades.

import { renderHeaderDeck } from '../packages/pi-stardeck/src/deck.ts';
import { parseDeckTitleState } from '../packages/pi-stardeck/src/title-state.ts';
import { shortenTitleTarget } from '../packages/status/src/title-state.ts';

const RESET = '\u001b[0m';
const BOLD = '\u001b[1m';
const COLORS = {
  dim: 90,
  success: 32,
  accent: 34,
  warning: 33,
  error: 31,
  text: 39,
  thinkingHigh: 35,
  customMessageLabel: 36,
};

const theme = {
  fg: (name, text) => `\u001b[${COLORS[name] ?? 39}m${text}${RESET}`,
  bold: (text) => `${BOLD}${text}${RESET}`,
};

const LONG_COMMAND =
  "npm test --workspace packages/pi-stardeck --test-name-pattern 'turn meter and label crop'";

function baseState() {
  return {
    elapsedMs: null,
    cwd: '~/projects/pi-stardeck',
    devbox: true,
    branch: 'main',
    gitAvailable: true,
    git: { staged: 0, modified: 7, untracked: 0, conflicts: 0 },
    model: 'GLM-4.7',
    thinking: 'medium',
    contextPercent: 38,
    compactionCount: 2,
    lsp: { healthy: 3, total: 3 },
    mcp: { healthy: 3, total: 3 },
    mode: 'insert',
    sessionShortId: 'c8dd2903',
    header: {
      activity: null,
      work: null,
      selection: null,
      suggestion: null,
      diagnostics: null,
      backgroundActivity: false,
      approvalRequired: false,
      blocked: false,
      counters: { agents: { active: 0, total: 0 } },
      progress: [],
    },
  };
}

function withTitle(state, title, turn, activeRunSpans) {
  state.header = {
    ...state.header,
    title: parseDeckTitleState(title),
    turn,
    ...(activeRunSpans ? { activeRunSpans } : {}),
  };
  return state;
}

const TURN = { tokens: 39_400, elapsedMs: 159_470 }; // 2m 39.47s → 002:39'47

function panel(label, state, width) {
  console.log(
    `\n── ${label} (${width} cols) ` +
      '─'.repeat(Math.max(0, width - label.length - 14)),
  );
  for (const line of renderHeaderDeck(state, width, theme)) {
    console.log(line);
  }
}

console.log('Deck line-3 preview — 2026-10-24 amendments');
console.log("  timer: deck chronometer 002:39'47 (was 2:39)");
console.log('  labels: crop at real width, 120-char protocol cap (was 48)');

// A — the pasted line, after: long bash label + chronometer turn meter.
panel(
  'A · long bash label, mid-turn',
  withTitle(
    baseState(),
    {
      v: 1,
      subject: 'Deck line-3 review — turn chronometer and label crop',
      work: { change: 'relax-deck-label-crop', task: '1', done: 0, total: 2 },
      activity: {
        class: 'bash',
        target: shortenTitleTarget(LONG_COMMAND),
        span: 'b7',
        parent: null,
      },
      waiver: null,
    },
    TURN,
    null,
  ),
  140,
);
console.log(
  '  ↑ old code cut this command at 48 chars: "npm test --workspace packages/pi-stardeck --t…"',
);

// B — subagent activity with the live span tree beneath line 3.
panel(
  'B · subagent + span tree',
  withTitle(
    baseState(),
    {
      v: 1,
      subject: 'Deck line-3 review — turn chronometer and label crop',
      work: { change: 'relax-deck-label-crop', task: '1', done: 0, total: 2 },
      activity: {
        class: 'subagent',
        target: 'code-reviewer',
        span: 's2',
        parent: 't9',
      },
      waiver: null,
    },
    TURN,
    [
      {
        id: 'sub-1:reviewer',
        kind: 'subagent',
        parent: 'sub-1',
        agent: 'reviewer',
        stage: 'assuring',
        elapsedMs: 41_000,
      },
      {
        id: 'bash-9',
        kind: 'bash',
        parent: 'turn-1',
        stage: 'working',
        elapsedMs: 12_340,
      },
    ],
  ),
  140,
);

// C — narrow frame: the same long label, now cropped by actual width.
panel(
  'C · same label at 80 cols — width owns the crop',
  withTitle(
    baseState(),
    {
      v: 1,
      subject: 'Deck line-3 review — turn chronometer and label crop',
      work: { change: 'relax-deck-label-crop', task: '1', done: 0, total: 2 },
      activity: {
        class: 'bash',
        target: shortenTitleTarget(LONG_COMMAND),
        span: 'b7',
        parent: null,
      },
      waiver: null,
    },
    TURN,
    null,
  ),
  80,
);
console.log('  ↑ the deck still truncates — but only when the frame truly runs out');
