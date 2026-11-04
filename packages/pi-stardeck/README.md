# pi-stardeck

A dependency-free Pi extension that coordinates the prompt information architecture
through Pi's supported widget and event APIs.

```text
─ 󰠭 › ────────────────────────────────────────────────────────────────────
󰠭 [󰆧]  ~/projects/example › main › +0 ~1 1        󰚩 Opus › high › 󰃰 42%
──────────────────────────────────────────────────────────────────────
Stabilize runtime and focus in the cockpit              planning 6/7 › 󰄱 9/19
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
editing deck.ts                                            00:38'00 · 4.2k
└ (00'12) scout working
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
󰃰 5h 52% › 󰆧 3% › 󰉡 48% › 󰞏 2 › 󰂻 268M › 󰄠 38% › 󰈛 $5.16          󰠭 abcd1234
```

The deck renders four stable rows above the editor:

1. **Where and what** — identity and companion chips lead, then the project path
   and Git segment; the right corner carries the engine group (model › thinking ›
   quota) and any alert.
2. **Focus** — the session subject (auto-titled from the first real prompt,
   settable through the `title` tool) with the OpenSpec work tile on the right.
3. **Pure activity band (optional)** — exists only while an observed activity is
   live — `editing`, `reading`, `grepping`, `bash`, or `subagent` — with the turn
   chronometer and token count riding on the right; subagent and bash child runs
   keep their `└` span rows directly beneath. Between tools and at rest the band
   retires entirely: Pi's own `Working…` indicator stays visible exactly as the
   core renders it, and no phase words or `awaiting Human` filler are ever
   generated.
4. **Machine and status** — quota, CPU/RAM, context, compactions, and session
   cost yield right-to-left into the width the status end leaves: notices when
   present, otherwise the dim ladybug sentinel wearing the short session id.

Rows appear only when they speak — a silent band and spanless state collapse
their seam. Every slot is bounded, sanitized display vocabulary; no message
content, thinking, reasoning, prompts, tool arguments, or child-agent output
enters the widget. Terminal display-cell measurement and final truncation remain
Unicode- and Nerd-Font-aware.

The additive header protocol projects selection independently from live work:

```ts
selection: {
  source: 'openspec' | 'subject' | 'legacy';
  titles: string[]; // one or two bounded, normalized titles
  color: HeaderColor;
} | null;
suggestion: HeaderSuggestion | null; // controlled enum, never generated prose
```

Selection priority remains exact OpenSpec Task, then Session Work. Older
protocol-1 events may use sanitized non-placeholder work titles as a legacy selection;
explicit malformed selection is rejected rather than borrowing a fallback. The
suggestion vocabulary is producer-owned, appears only in waiting, blocked, approval,
or aborted states, and is bounded to reporting cues such as
`requesting validation or redirection`, `awaiting continuation`, and
`requesting redirection`. While work is active, the same slot reports the current
WHAT: the focused task title with live step progress.

The preferred activity contract is a structured path that never stores separators:

```ts
work.activityPath?: Array<{
  id: string;       // lowercase letters, digits, and hyphens; at most 48 code points
  label: string;    // one line; normalized to at most 48 code points
  compact?: string; // normalized to at most 24 code points
  current?: number;
  total?: number;
}>; // at most six unique segments; lifecycle is not duplicated here
```

An explicit valid array, including `[]`, takes precedence. A malformed array is rejected
as a whole and falls back to the legacy allowlisted `work.activity` field. Legacy
activity is normalized to one internal segment, preserving existing producers until they
migrate. Progress is bounded to `0..9,999` and appended as `current/total` only when
both values are valid.

The consumer removes ANSI escapes and control characters, normalizes whitespace, rejects
empty labels and malformed or duplicate IDs, and fails soft. Semantic safety remains a
producer obligation: labels must be bounded display vocabulary, never prompts, commands,
paths, secrets, generated paragraphs, or tool output. The consumer cannot infer those
semantics from arbitrary text. The future global-flow producer selects one primary
active path; completed, skipped, sibling, and parallel aggregation remain out of scope.

The legacy `work.activity` enum remains temporarily supported. Its renderer-owned labels
convert operation starts such as `inspection` and `mutation` into
`inspecting project context` and `updating selected files`. Their bounded completion
transitions render as `finalizing current request`, `reviewing applied changes`, or
`reviewing check results`; unknown kinds and raw activity text remain omitted.

The extension refreshes bounded local Git branch and status data at session start, after
successful mutating tools, and when the agent settles. Footer row one keeps project
identity on the left and work scope on the right. The bold PWD is shown in full relative
to home (`/home/aemonge/projects/example` → `~/projects/example`) and yields ANSI-safely
only when the terminal cannot preserve both aligned groups. Git branch and state follow
a blue minor `›`. Outside a repository, one dim responsive `›  (no Git)` state fills
the otherwise missing project slot and yields before core project/work information on
narrow terminals. Slash-prefixed Git branches collapse the prefix to its initial and cap
display at 30 cells with `...` (`feat/persist-versioned-prompts-in-duckdb` →
`f/persist-versioned-prompts...`). The right side shows compact OpenSpec Plan/Task
progress, or the simple Focus or `no OpenSpec` fallback when no OpenSpec
portfolio is available. The footer reserves a four-cell visual split between alignment
groups. OpenSpec uses icons instead of repeated labels: task-list `` for Plans and
notebook `` for Tasks, with minor `›` between them. Their Nerd Font glyphs exactly
match Starship: ``, ``, ``, ``, and ``. When `DEVBOX_PROJECT_ROOT` is present, the
PWD begins `[󰆧]  ~/project`; the boxed Devbox marker precedes the folder icon without
exposing the variable's value. The top prompt rail may prepend MCP availability to work
progress as ` healthy/total ⟩  Plans ›  Tasks`. MCP status comes only from the live
`pi-mcp-adapter/status/v1` feed; lazy cached or not-yet-connected servers remain
available, while failed or authentication-blocked servers reduce the numerator. This is
availability telemetry, not a tool-call counter. Before the first valid snapshot, or
when status is empty or malformed, the segment remains visible as dim ` 0/0`. The
entire segment yields before right-aligned work progress is truncated. Neovim LSP
inventory is intentionally neither collected nor shown because it does not establish an
agent-usable LSP capability. Plugin and extension inventory is not shown without a
trustworthy runtime health source. Adjacent left and right segments use the same Gruvbox
colors as the configured Starship prompts: blue `#076678`, green `#79740e`, bright green
`#689d6a`, aqua `#427b58`, yellow `#b57614`, orange `#af3a03`, major-separator Gruvbox
purple `#b16286`, blue-violet `#5c5ca8`, and red `#9d0006`. Project, Git, work-scope,
model, quota, and local telemetry avoid generic gray; only missing Git and the runtime
chronometer are deliberately dim. PWD and model identity share the same blue anchor
color; reasoning retains its own level color. The single footer row keeps PWD and Git on
the left and model, reasoning, and quota on the right. Other bounded widget snapshots
feed the prompt rails: mode alone on the left and optional MCP availability plus work
progress on the right of the top rail; chronometer left and context, compactions,
memory, CPU, and cost right on the bottom rail. A major separator distinguishes model
context from process resources. On wide terminals the footer ends with the dedicated
five-cell avatar tail `⟨ 󰠭`: a purple left-pointing boundary, violet ladybug, and one
blank cell to her right. Each rail aligns its own groups independently, so the header is
never padded for cross-row alignment. CPU is normalized against Pi's available logical
CPU capacity and capped at 100%, so the number reads as whole-machine share rather than
one-core units. CPU and RAM are blue normally and independently turn yellow only for
sustained CPU pressure above 80% or unusually high session memory; one resource warning
does not recolor its neighbors. Pink and red are never used in these three telemetry
groups. In the title, lifecycle and bounded activity are blue; the major boundary is
purple; real focus and optional Task hierarchy are green; empty focus fallbacks and the
footer runtime age/state are dim. Persistent cache-hit presentation is disabled and no
module keeps cache accounting since the footer fork's replacement. Compaction count is hidden at zero.
The first deck row always begins with the compact runtime capsule
`( children ›  subagents · 00:00'00)`. Each zero count and the settled timer remain
dim in place; a live count or timer changes color without moving neighboring content.
The active-run aggregate no longer appears in the lower resource row. Final
narrow-width fitting remains ANSI-aware and removes exposed trailing separators. The
renderer never shows the main Pi process, historical worker totals, completed-file
progress, queued subagent placeholders, or runtime identity and output fields.
Quota is reduced to the most constrained provider-reported percentage with no weekly
analysis. Cost is Pi's native estimated session cost in USD, rendered without trailing
fractional zeros; its preceding `⟩` retains the shared purple major-boundary color while
the value remains blue. No local daily aggregation or currency conversion is performed.
No center group or gauges are used. The deck's widget protocol (historically the
Fancy Footer protocol, `pi-fancy-footer:widget`) accepts these native theme tokens. The narrative lifecycle header begins with
its active/passive terminal icon; the prompt border keeps only its right-aligned vi-mode
glyph. Concurrent Git refreshes coalesce without polling.

Agent-environment, context, CPU, RAM, and compaction widgets use the same widget
protocol, including producer-requested bold text for the PWD. Every three seconds on
Linux, the extension discovers only Pi descendants through bounded
`/proc/<pid>/task/<pid>/children` reads, then reads their `stat` and `status` records
without shelling out or retaining process names, arguments, or paths. Memory sums
private anonymous resident pages (`RssAnon`) instead of counting shared file-backed
pages once per process. Individual status-read failures fall back to that process's RSS;
unavailable `/proc` falls back honestly to current-process CPU and RSS. Sampling,
smoothing, publication, timers, and resource widgets are session-scoped and cleaned up
on shutdown. Session-cost collection lives in `packages/footer`; cache and quota
collection were removed with the fork, leaving quota as an empty seam.
When the footer reports quota windows, the compact telemetry row paints icon-native
tiles in cost, long-window, coding-window order — `󰜦 $5.21 ⟩ 󰃰 12% ⟩ 󰈸 62% › 󰅐 1:45`.
The flame is the coding window's permanent icon and always carries the clock
countdown; 80% used turns a tile's accent color into a warning. Without windows the
slot degrades to the single footer-reported percent, and without telemetry it stays a
dim dash.
Unavailable temperature and unsupported environment claims are hidden; environment
classification defaults honestly to `host` unless an explicit supported marker exists.

## Test

```sh
npm install
npm run check
```

## Remove

Delete `./packages/pi-stardeck` from `.pi/agent/settings.json`, remove this
directory, and run `/reload`.
