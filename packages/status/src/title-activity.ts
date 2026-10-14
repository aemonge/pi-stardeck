import {
  shortenTitleTarget,
  type TitleActivityClass,
  type TitleActivityState,
} from './title-state.ts';

/**
 * Activity feed for the title state (`deck-title-state`).
 *
 * Classifies tool-execution starts/updates into the observed activity classes
 * with a short target label, attributes `span`/`parent` from the same span
 * ids the runtime span store uses (turn root, bash/subagent containers,
 * per-agent children), keeps only the newest event, and resets to null at
 * turn end. Direct tools are owned by the turn span; bash and subagent
 * containers own their own span ids.
 */

const EDITING_TOOLS = new Set(['edit', 'write']);
const READING_TOOLS = new Set(['read', 'ls']);
const GREPPING_TOOLS = new Set(['grep', 'find']);
const BASH_TOOLS = new Set(['bash', 'powershell']);
const SUBAGENT_TOOL = 'subagent';

const FALLBACK_SUBAGENT_TARGET = 'subagent';

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function shortTarget(value: unknown): string | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  const shortened = shortenTitleTarget(raw);
  return shortened || undefined;
}

function firstAgentArg(args: unknown): string | undefined {
  const input = record(args);
  if (!input) return undefined;
  const single = text(input.agent);
  if (single) return single;
  for (const key of ['calls', 'tasks', 'chain'] as const) {
    const list = Array.isArray(input[key]) ? input[key] : undefined;
    const agent = list ? text(record(list[0])?.agent) : undefined;
    if (agent) return agent;
  }
  return undefined;
}

export type TitleActivityClassification = {
  class: TitleActivityClass;
  target: string;
};

/**
 * Classify one tool execution into a title activity class with a bounded
 * target label. Returns undefined for tools outside the observed classes or
 * when no bounded target label can be derived (except subagent, which falls
 * back to a generic label until agent names stream in).
 */
export function classifyTitleActivity(
  toolName: string,
  args: unknown,
): TitleActivityClassification | undefined {
  const tool = toolName.trim().toLowerCase();
  const input = record(args);

  if (EDITING_TOOLS.has(tool)) {
    const target = shortTarget(input?.path);
    return target ? { class: 'editing', target } : undefined;
  }
  if (READING_TOOLS.has(tool)) {
    const target =
      tool === 'ls' ? (shortTarget(input?.path) ?? '.') : shortTarget(input?.path);
    return target ? { class: 'reading', target } : undefined;
  }
  if (GREPPING_TOOLS.has(tool)) {
    const target = shortTarget(input?.pattern);
    return target ? { class: 'grepping', target } : undefined;
  }
  if (BASH_TOOLS.has(tool)) {
    const target = shortTarget(input?.command);
    return target ? { class: 'bash', target } : undefined;
  }
  if (tool === SUBAGENT_TOOL) {
    return {
      class: 'subagent',
      target: shortTarget(firstAgentArg(args)) ?? FALLBACK_SUBAGENT_TARGET,
    };
  }
  return undefined;
}

interface PartialAgentResult {
  agent?: string;
  active: boolean;
}

function partialAgentResults(partialResult: unknown): PartialAgentResult[] | undefined {
  const details = record(record(partialResult)?.details);
  if (details?.kind !== 'pi-subagent' || !Array.isArray(details.results)) {
    return undefined;
  }
  return details.results.map((rawResult) => {
    const result = record(rawResult);
    return {
      agent: text(result?.agent),
      active:
        result?.exitCode === -1 &&
        result.sawAgentStart === true &&
        result.sawAgentSettled !== true,
    };
  });
}

function callsAgentName(args: unknown, index: number): string | undefined {
  const rawCalls = Array.isArray(args)
    ? args
    : Array.isArray(record(args)?.calls)
      ? (record(args) as { calls: unknown[] }).calls
      : undefined;
  if (!rawCalls) return undefined;
  return text(record(rawCalls[index])?.agent);
}

function sameActivity(
  left: TitleActivityState | null,
  right: TitleActivityState | null,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export class TitleActivityFeed {
  private newest: TitleActivityState | null = null;

  /** The newest observed event, or null when idle. */
  current(): TitleActivityState | null {
    return this.newest;
  }

  /** Clear the feed at turn end. Returns true when an event was dropped. */
  reset(): boolean {
    if (this.newest === null) return false;
    this.newest = null;
    return true;
  }

  /**
   * Observe a tool-execution start. Bash and subagent containers own their
   * span id (the tool call id); direct tools are owned by the turn span, so
   * they publish `parent: null` unless no turn is active, in which case the
   * tool call id stands in.
   */
  begin(
    toolCallId: string,
    toolName: string,
    args: unknown,
    turnSpanId: string | null,
  ): boolean {
    const classification = classifyTitleActivity(toolName, args);
    if (!classification) return false;
    const owned =
      classification.class === 'bash' || classification.class === 'subagent';
    const event: TitleActivityState = owned
      ? {
          class: classification.class,
          target: classification.target,
          span: toolCallId,
          parent: turnSpanId,
        }
      : {
          class: classification.class,
          target: classification.target,
          span: turnSpanId ?? toolCallId,
          parent: null,
        };
    return this.set(event);
  }

  /**
   * Observe a tool-execution update. Subagent partial results publish the
   * newest active per-agent child span (nested under its container id);
   * other tools refresh their start event with the same attribution.
   */
  update(
    toolCallId: string,
    toolName: string,
    args: unknown,
    partialResult: unknown,
    turnSpanId: string | null,
  ): boolean {
    const results = partialAgentResults(partialResult);
    if (results) {
      for (let index = results.length - 1; index >= 0; index -= 1) {
        const result = results[index];
        if (!result?.active) continue;
        const target =
          shortTarget(result.agent) ??
          shortTarget(callsAgentName(args, index)) ??
          FALLBACK_SUBAGENT_TARGET;
        return this.set({
          class: 'subagent',
          target,
          span: `${toolCallId}:${index}`,
          parent: toolCallId,
        });
      }
      return false;
    }
    return this.begin(toolCallId, toolName, args, turnSpanId);
  }

  private set(event: TitleActivityState): boolean {
    if (sameActivity(this.newest, event)) return false;
    this.newest = event;
    return true;
  }
}
