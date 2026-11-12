// Showcase: the deck band before/after simplify-deck-band, driven through the
// real renderer with the screenshot's state. Plain theme (no ANSI) so it reads
// in any transcript; run with: node openspec/changes/simplify-deck-band/showcase-band.mjs
import { renderHeaderDeck } from '../../packages/pi-stardeck/src/deck.ts';

const plainTheme = { fg: (_c, t) => t, bold: (t) => t };

const bashTarget =
  'cargo test -p database --tests --features registry-http 2>&1 | tail -25';

function state({ clocks = true, spans = true } = {}) {
  return {
    elapsedMs: 163_220,
    header: {
      activity: { class: 'bash', target: bashTarget },
      work: {
        lifecycle: 'working',
        titles: ['Fix CI rustfmt, coverage, and PromptVariable test errors'],
        color: 'accent',
      },
      selection: {
        source: 'openspec',
        titles: ['5-post-delivery.md 5/5'],
        color: 'accent',
      },
      suggestion: 'eospec close',
      diagnostics: null,
      backgroundActivity: false,
      approvalRequired: false,
      blocked: false,
      counters: {
        agents: { active: 0, total: 0 },
        activeRuns: { children: 1, subagents: 0 },
        tasks: { completed: 0, total: 1 },
        steps: { completed: 18, total: 19 },
        files: { completed: 5, total: 5 },
      },
      progress: [],
      ...(clocks ? { turn: { tokens: 222_200, elapsedMs: 163_220 } } : {}),
      ...(spans
        ? {
            activeRunSpans: [
              { id: 't1', kind: 'bash', stage: 'working', elapsedMs: 83_000 },
            ],
          }
        : {}),
    },
    cwd: '~/projects/kernel-rust',
    devbox: false,
    branch: 'f/fix-financial-brief-contract',
    gitAvailable: true,
    git: { staged: 0, modified: 20, untracked: 0, conflicts: 0 },
    model: 'GLM-5.3-Flash',
    thinking: 'high',
    contextPercent: 38,
    contextTokens: 48 * 1024,
    contextWindow: 200 * 1024,
    compactionCount: 0,
    resources: {
      cpuPercent: 0.1,
      memoryBytes: 149 * 1024 * 1024,
      cpuWarning: false,
      memoryWarning: false,
    },
    footerTelemetry: {
      totalCost: 0.03,
      quotaPercent: 30,
      quotaWindows: [
        { label: '2h', percent: 2, resetAt: Date.now() + 252_000 },
        { label: '7d', percent: 30 },
      ],
    },
    lsp: { healthy: 2, total: 2 },
    mcp: { healthy: 1, total: 1 },
    mode: 'normal',
  };
}

function block(title, lines) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 118 - title.length))}`);
  for (const line of lines) console.log(line);
}

// 1. TODAY — the screenshot moment, real renderer.
block('TODAY (clocks + full telemetry)', renderHeaderDeck(state(), 118, plainTheme));

// 2. Renderer-only removal (O1a) — unchanged renderer, no clock data.
block(
  'AFTER · renderer-only removal (status keeps publishing)',
  renderHeaderDeck(state({ clocks: false, spans: false }), 118, plainTheme),
);

// 3. Full retirement (O1b) + the three telemetry shapes (O2) — proposed rows
//    composed in the deck's own visual language (same glyphs, same rules).
const today = renderHeaderDeck(state(), 118, plainTheme);
const subjectRow = today[1]; // line 2 (subject + work) is untouched by this change.
const contextTile = '󰒋 38%';

const shapeStatic = [
  subjectRow,
  `bash ${bashTarget}`,
  `󰚩 GLM-5.3-Flash › high ⟩ ${contextTile}`,
];

const shapeNotable = [
  subjectRow,
  `bash ${bashTarget}`,
  '(band telemetry: silent while quota < 60%, cost < $1, resources calm — tiles pop in only when notable)',
  '   pops to:  󰈸 62% › 󰅐 1:12 ⟩ 󰜦 $1.40',
];

const shapeHybrid = [
  subjectRow,
  `bash ${bashTarget}`,
  `󰚩 GLM-5.3-Flash   (rest silent until notable: 󰈸 62% › 󰅐 1:12 ⟩ 󰜦 $1.40)`,
];

block('AFTER · full retirement + O2i static minimal', shapeStatic);
block('AFTER · full retirement + O2ii notable-only (healthy)', shapeNotable);
block('AFTER · full retirement + O2iii hybrid', shapeHybrid);

// 4. The hung-process story after the change — lives in the workspace.
console.log(`\n── Workspace time story (unchanged lines are core's) ${'─'.repeat(29)}`);
console.log('▸ Ran cargo fmt && cargo fmt --check && echo FMT-CLEAN (1.8s)');
console.log('');
console.log(`▸ Running ${bashTarget} (5m 12s)            ← live loader elapsed, ticks every second`);
console.log('');
console.log('Sent 14:32:05');
console.log('Done at 14:33:18 · 1m 13s                    ← turn total, stamped when it settles');
console.log('');
