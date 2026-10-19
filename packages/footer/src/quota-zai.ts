import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import {
  registerQuotaProvider,
  type QuotaSnapshot,
  type QuotaWindow,
} from './quota.ts';

/**
 * z.ai/GLM coding-plan QuotaProvider — the first registration on the
 * quota seam. Clean-room envelope facts (recovered from git history,
 * not copied): Bearer-authenticated GET on the quota-limit endpoint,
 * `{ data: { limits: [...] } }` with usage as `percentage` or
 * `usage`+`currentValue`, `nextResetTime` in unix seconds, and `TIME*`
 * limits being the monthly MCP allowance (skipped — the token/credit
 * pair gates coding sessions).
 *
 * Fail-soft contract: no key, unreachable API, or malformed envelope →
 * `snapshot()` returns `undefined` and the deck stays dark. The last
 * successful snapshot is cached between ticks so a transient failure
 * never blanks a lit gauge; at most one debug line per distinct failure
 * mode.
 */

const ZAI_QUOTA_ENDPOINT = 'https://api.z.ai/api/monitor/usage/quota/limit';
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const SECONDS_PER_HOUR = 3600;

export interface ZaiQuotaOptions {
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Injectable for tests; defaults to ~/.pi/agent/auth.json. */
  authPath?: string;
  /** Injectable for tests; unix seconds. */
  now?: () => number;
  /** Debug sink; at most one line per distinct failure mode. */
  debug?: (message: string) => void;
}

export interface ZaiQuotaHandle {
  readonly id: 'zai';
  refresh(): Promise<void>;
  stop(): void;
}

const AUTH_REFERENCE_PATTERN = /^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$/;

/**
 * pi auth convention: a key is either a literal or a `${ENV}` reference.
 * Unresolvable references yield undefined (fail-soft, no guesses).
 */
export function expandAuthReference(value: string): string | undefined {
  const match = AUTH_REFERENCE_PATTERN.exec(value.trim());
  if (match === null) return value;
  const expanded = process.env[match[1]];
  return typeof expanded === 'string' && expanded.length > 0 ? expanded : undefined;
}

/** Reads the z.ai key from the pi auth file: `{ zai: { key } }`. */
export async function readZaiKey(
  authPath: string,
  readFileImpl: typeof readFile = readFile,
): Promise<string | undefined> {
  let text: string;
  try {
    text = await readFileImpl(authPath, 'utf8');
  } catch {
    return undefined;
  }
  try {
    const parsed = JSON.parse(text) as { zai?: { key?: unknown } };
    const key = parsed?.zai?.key;
    return typeof key === 'string' && key.length > 0
      ? expandAuthReference(key)
      : undefined;
  } catch {
    return undefined;
  }
}

interface ZaiLimitLike {
  type?: unknown;
  percentage?: unknown;
  usage?: unknown;
  currentValue?: unknown;
  nextResetTime?: unknown;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function windowLabel(resetAt: number, nowSeconds: number): string {
  const hours = (resetAt - nowSeconds) / SECONDS_PER_HOUR;
  if (hours <= 48) return '5h';
  if (hours <= 360) return '7d';
  return `${Math.max(1, Math.ceil(hours / 24))}d`;
}

/**
 * Normalizes the z.ai envelope into reset-sorted windows: nearest reset
 * is the coding window (`5h`), next the weekly cap (`7d`), labels fall
 * back by reset distance. Returns undefined when nothing usable remains.
 */
export function normalizeZaiEnvelope(
  envelope: unknown,
  nowSeconds: number,
): QuotaWindow[] | undefined {
  const limits = (envelope as { data?: { limits?: unknown } })?.data?.limits;
  if (!Array.isArray(limits) || limits.length === 0) return undefined;
  const windows: Array<QuotaWindow & { resetAt: number }> = [];
  for (const raw of limits as ZaiLimitLike[]) {
    if (typeof raw !== 'object' || raw === null) continue;
    // TIME* limits are the monthly MCP allowance — not coding sessions.
    if (typeof raw.type === 'string' && raw.type.startsWith('TIME')) continue;
    let percent: number | undefined;
    if (typeof raw.percentage === 'number' && Number.isFinite(raw.percentage)) {
      percent = clampPercent(raw.percentage);
    } else if (
      typeof raw.usage === 'number' &&
      Number.isFinite(raw.usage) &&
      raw.usage > 0 &&
      typeof raw.currentValue === 'number' &&
      Number.isFinite(raw.currentValue)
    ) {
      percent = clampPercent((raw.currentValue / raw.usage) * 100);
    }
    if (percent === undefined) continue;
    if (
      typeof raw.nextResetTime !== 'number' ||
      !Number.isFinite(raw.nextResetTime) ||
      raw.nextResetTime <= 0
    ) {
      continue; // sort and labels ride on the reset deadline
    }
    const resetAt = Math.floor(raw.nextResetTime);
    windows.push({ label: windowLabel(resetAt, nowSeconds), percent, resetAt });
  }
  if (windows.length === 0) return undefined;
  windows.sort((a, b) => a.resetAt - b.resetAt);
  return windows;
}

let started: ZaiQuotaHandle | undefined;
let cached: QuotaSnapshot | undefined;

// Registered once per process; reads module state so a stop/restart
// cycle never leaves the registry holding a dead closure.
registerQuotaProvider({ id: 'zai', snapshot: () => cached });

/**
 * Registers the z.ai provider and starts the cadence: refresh on start,
 * on every `refresh()` call (the footer triggers session start and model
 * change), and on a 5-minute interval. Idempotent per process.
 */
export function startZaiQuotaProvider(options: ZaiQuotaOptions = {}): ZaiQuotaHandle {
  if (started !== undefined) return started;
  const fetchImpl = options.fetchImpl ?? fetch;
  const authPath = options.authPath ?? join(homedir(), '.pi', 'agent', 'auth.json');
  const now = options.now ?? (() => Math.floor(Date.now() / 1000));
  const reported = new Set<string>();
  const debug = (mode: string) => {
    if (reported.has(mode)) return;
    reported.add(mode);
    options.debug?.(`zai quota: ${mode}`);
  };

  const refresh = async (): Promise<void> => {
    const key = await readZaiKey(authPath);
    if (key === undefined) {
      debug('no key in ~/.pi/agent/auth.json (zai.key)');
      return;
    }
    let response: Response;
    try {
      response = await fetchImpl(ZAI_QUOTA_ENDPOINT, {
        headers: { authorization: `Bearer ${key}` },
      });
    } catch {
      debug('unreachable');
      return;
    }
    if (!response.ok) {
      debug(`http ${response.status}`);
      return;
    }
    let envelope: unknown;
    try {
      envelope = await response.json();
    } catch {
      debug('unparseable envelope');
      return;
    }
    const windows = normalizeZaiEnvelope(envelope, now());
    if (windows === undefined) {
      debug('no usable windows');
      return;
    }
    reported.clear(); // a success re-arms distinct-mode reporting
    cached = { percent: windows[0]!.percent, windows };
  };

  void refresh();
  const timer = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
  timer.unref?.();

  started = {
    id: 'zai',
    refresh,
    stop() {
      clearInterval(timer);
      cached = undefined;
      reported.clear();
      started = undefined;
    },
  };
  return started;
}
