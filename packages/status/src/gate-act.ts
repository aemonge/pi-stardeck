import { promises as fs } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { CommandRunner } from './types.ts';

/** Relay budget: the gate's act line is cockpit commentary — a slow or
 *  absent gate must cost less than a refresh, never block one. */
const GATE_PROBE_TIMEOUT_MS = 2_000;
/** Re-probe cadence when the meta file cannot be statted at all — time
 *  is the only cache key left, so it steps lightly. */
const ABSENT_META_TTL_MS = 30_000;

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/gu;

interface GateActCacheEntry {
  mtimeMs?: number;
  at: number;
  line: string | undefined;
}

/** mtime-keyed relay cache: one probe per meta mtime, negatives cached
 *  exactly like hits — a missing or refusing gate must never become a
 *  per-render spawn storm. Keyed by contained change root, not slug. */
const gateActCache = new Map<string, GateActCacheEntry>();

function containedChangeRoot(projectRoot: string, change: string): string | undefined {
  const changesRoot = resolve(projectRoot, 'openspec', 'changes');
  const changeRoot = resolve(changesRoot, change);
  if (changeRoot === changesRoot || !changeRoot.startsWith(`${changesRoot}${sep}`)) {
    return undefined;
  }
  return changeRoot;
}

/**
 * The gate's teaching line for one change, relayed verbatim:
 * `pios-gate act <slug>` owns truth and words; this module owns only
 * placement and cost. Any non-zero exit (the act command exits 2 on
 * unknown changes), timeout kill, spawn failure, or empty output yields
 * `undefined` — declared focus renders alone, quietly. The meta file is
 * never parsed: its mtime only keys the cache.
 */
export async function resolveGateAct(options: {
  change: string;
  projectRoot: string;
  runner: CommandRunner;
  now?: number;
}): Promise<string | undefined> {
  const changeRoot = containedChangeRoot(options.projectRoot, options.change);
  if (!changeRoot) return undefined;
  const now = options.now ?? Date.now();

  let mtimeMs: number | undefined;
  try {
    mtimeMs = (await fs.stat(resolve(changeRoot, '.openspec.yaml'))).mtimeMs;
  } catch {
    mtimeMs = undefined;
  }

  const cached = gateActCache.get(changeRoot);
  if (
    cached &&
    (cached.mtimeMs !== undefined
      ? cached.mtimeMs === mtimeMs
      : mtimeMs === undefined && now - cached.at < ABSENT_META_TTL_MS)
  ) {
    return cached.line;
  }

  let line: string | undefined;
  try {
    const result = await options.runner('pios-gate', ['act', options.change], {
      cwd: options.projectRoot,
      timeoutMs: GATE_PROBE_TIMEOUT_MS,
    });
    if (result.code === 0 && !result.killed) {
      const firstLine = String(result.stdout).split('\n', 1)[0] ?? '';
      const cleaned = firstLine.replace(CONTROL_CHARACTERS, ' ').trim();
      if (cleaned) line = cleaned;
    }
  } catch {
    // Missing binary, spawn refusal, whatever went wrong: no gate line.
  }
  gateActCache.set(changeRoot, { mtimeMs, at: now, line });
  return line;
}
