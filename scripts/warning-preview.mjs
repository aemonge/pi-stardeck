#!/usr/bin/env node
// Preview (not packed — scripts/ ships in neither tarball nor package):
// paints the below-prompt warning line (move-warning-below-prompt,
// 2026-11-11) so the Human can validate glyph and severity without a
// live session:
//
//   node --import tsx/esm scripts/warning-preview.mjs
//
// Case A is the graphify companion's degraded status verbatim (warning
// yellow); case B rides the blocked notice at error red; case C is a
// clean room — silence renders nothing, never a reserved slot.

import { renderWarningLine } from '../packages/pi-stardeck/src/deck.ts';

const RESET = '\u001b[0m';
const COLORS = {
  warning: 33,
  error: 31,
};

const theme = {
  fg: (name, text) => `\u001b[${COLORS[name] ?? 39}m${text}${RESET}`,
  bold: (text) => text,
};

const cases = [
  {
    label: 'A · degraded companion — warning yellow',
    state: {
      piStatus: {
        errors: 0,
        warnings: 1,
        nativeStatusCount: 1,
        nativeStatuses: [
          {
            key: 'graphify',
            text: 'graphify active · report available · update recommended',
          },
        ],
      },
    },
  },
  {
    label: 'B · blocked change — error red',
    state: { header: { blocked: true } },
  },
  {
    label: 'C · clean room — silence',
    state: {},
  },
];

console.log('Below-prompt warning preview — move-warning-below-prompt');
for (const { label, state } of cases) {
  console.log(`\n── ${label} ` + '─'.repeat(Math.max(0, 100 - label.length)));
  const lines = renderWarningLine(state, 120, theme);
  if (lines.length === 0) {
    console.log('(nothing renders below the prompt)');
    continue;
  }
  for (const line of lines) console.log(line);
}
