#!/usr/bin/env node
// Temporary preview (not packed — scripts/ ships in neither tarball nor
// package): renders the corner chip cluster in every severity mix under
// three styling variants, so the Human can judge whether the reverse-
// video colors alone are strong enough to drop `[` and `(` entirely.
//
//   node scripts/chips-preview.mjs
//
// Variant A — shapes + BG (what the deck renders today)
// Variant B — BG colors only, no enclosures (the proposal)
// Variant C — bold foreground only, no enclosures (the rejected past)

const RESET = '\u001b[0m';
const BOLD = '\u001b[1m';
const REVERSE = '\u001b[7m';

// Standard 16-color approximations of the deck's theme slots. The live
// theme may remap hues slightly; judge contrast, not exact shade.
const BLUE = 34; // accent / devbox OK
const YELLOW = 33; // warning
const RED = 31; // error / off
const MUTED = 90; // bright-black

const DEVBOX = '\u{F01A7}';
const ENGRAM = '\u{F04E6}';
const GRAPHIFY = '\u{E83D}';
const APPA = '\u{F49C}';

function bg(color, text) {
  return `${REVERSE}${BOLD}\u001b[${color}m${text}${RESET}`;
}
function fgBold(color, text) {
  return `${BOLD}\u001b[${color}m${text}${RESET}`;
}

function chips(variant, states) {
  // states: { devbox: 'ok'|'ko', engram/graphify/appa: 'ok'|'warn'|'err' }
  const render = (icon, state, okColor) => {
    const color =
      state === 'err' || state === 'ko' ? RED : state === 'warn' ? YELLOW : okColor;
    if (variant === 'C') return fgBold(color, icon);
    const enclosed =
      state === 'err' || state === 'ko'
        ? `[${icon}]`
        : state === 'warn'
          ? `(${icon})`
          : icon;
    return variant === 'A' ? bg(color, enclosed) : bg(color, icon);
  };
  const parts = [
    render(DEVBOX, states.devbox, BLUE),
    render(ENGRAM, states.engram, BLUE),
    render(GRAPHIFY, states.graphify, BLUE),
    render(APPA, states.appa, BLUE),
  ];
  return parts.join(' ');
}

const scenarios = [
  ['all OK (in devbox)', { devbox: 'ok', engram: 'ok', graphify: 'ok', appa: 'ok' }],
  [
    'all OK (host, no devbox)',
    { devbox: 'ko', engram: 'ok', graphify: 'ok', appa: 'ok' },
  ],
  ['all warn', { devbox: 'ko', engram: 'warn', graphify: 'warn', appa: 'warn' }],
  ['all error/off', { devbox: 'ko', engram: 'err', graphify: 'err', appa: 'err' }],
  ['mixed (the norm)', { devbox: 'ko', engram: 'ok', graphify: 'warn', appa: 'err' }],
];

for (const [label, variant] of [
  ['A — shapes + BG (deck today)', 'A'],
  ['B — BG only, no brackets/parens (proposal)', 'B'],
  ['C — bold foreground only (the failed past)', 'C'],
]) {
  console.log(`\n=== Variant ${label} ===`);
  for (const [name, states] of scenarios) {
    console.log(`  ${chips(variant, states)}   <- ${name}`);
  }
}

console.log(
  `\n${fgBold(MUTED, 'Muted/off reference (variant C):')} ${fgBold(MUTED, APPA)}`,
);
console.log('\nIf variant B reads unambiguous at a glance (even dimmed), the');
console.log('enclosures can go; if OK vs warn blurs, keep variant A.');
