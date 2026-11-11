import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/**
 * The room aim — `openspec/.focus`, the Human's standing word for the
 * room. Render law (observe-room-aim 2026-11-11): the deck reads it
 * as-is and prints it as-is — a printer, not a translator. Five flat
 * YAML fields; a missing field drops its segment and the separator that
 * led it; absence never becomes zero; `change` is the keystone — no
 * change, no aim.
 */
export type RoomAim = {
  change: string;
  artifactName?: string;
  artifactIdx?: string;
  task?: string;
  nextStep?: string;
  /** The aim file's mtime — cache key only, never rendered. */
  mtimeMs: number;
};

const CHANGE_MAX = 120;
const ARTIFACT_NAME_MAX = 120;
const COUNT_MAX = 32;
const NEXT_STEP_MAX = 180;
const WALK_LIMIT = 40;
const ABSENT_TTL_MS = 30_000;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/gu;

const AIM_FIELDS = new Set([
  'change',
  'artifact-name',
  'artifact-idx',
  'task',
  'next-step',
]);

/** Collapse control characters to spaces and trim — the one cleanliness a
 * terminal printer owes; honest content passes untouched. A symmetric
 * YAML quote pair is syntax, not content: `"…"` and '…' unwrap before the
 * emptiness check, so `task: ""` drops its segment like any missing
 * field. */
function printable(value: string): string {
  const text = value.replace(CONTROL_CHARACTERS, ' ').trim();
  if (
    text.length >= 2 &&
    ((text.startsWith('"') && text.endsWith('"')) ||
      (text.startsWith("'") && text.endsWith("'")))
  ) {
    return text.slice(1, -1).trim();
  }
  return text;
}

/** Over-bound or empty values drop their field — absence, never a
 * mid-token ellipsis; the Human re-aims rather than the deck inventing. */
function field(value: string | undefined, maximum: number): string | undefined {
  if (value === undefined) return undefined;
  const text = printable(value);
  if (text.length === 0 || Array.from(text).length > maximum) return undefined;
  return text;
}

/**
 * Parse the aim text into its five fields. Garbage lines are ignored;
 * duplicate keys — last one wins; empty or comment-only values count as
 * missing. An aim without `change` is not an aim.
 */
export function parseRoomAim(text: string, mtimeMs: number): RoomAim | undefined {
  const values = new Map<string, string>();
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue;
    const colon = trimmed.indexOf(':');
    if (colon <= 0) continue;
    const key = trimmed.slice(0, colon).trim();
    if (!AIM_FIELDS.has(key)) continue;
    values.set(key, trimmed.slice(colon + 1).trim());
  }
  const change = field(values.get('change'), CHANGE_MAX);
  if (!change) return undefined;
  const artifactName = field(values.get('artifact-name'), ARTIFACT_NAME_MAX);
  const artifactIdx = field(values.get('artifact-idx'), COUNT_MAX);
  const task = field(values.get('task'), COUNT_MAX);
  const nextStep = field(values.get('next-step'), NEXT_STEP_MAX);
  return {
    change,
    ...(artifactName ? { artifactName } : {}),
    ...(artifactIdx ? { artifactIdx } : {}),
    ...(task ? { task } : {}),
    ...(nextStep ? { nextStep } : {}),
    mtimeMs,
  };
}

function findOpenspecRoot(cwd: string): string | undefined {
  let dir = resolve(cwd);
  for (let step = 0; step < WALK_LIMIT; step += 1) {
    if (existsSync(join(dir, 'openspec'))) return join(dir, 'openspec');
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
  return undefined;
}

type Cache =
  | { path: string; mtimeMs: number; aim: RoomAim | undefined }
  | { path: string; absentAt: number };

let cache: Cache | undefined;

/**
 * Read the room aim for `cwd`. One `stat` per refresh — the file is only
 * re-read when the mtime moves; an absent file is remembered for
 * ABSENT_TTL_MS so a missing aim costs no per-render stat storm.
 */
export function readRoomAim(
  cwd: string,
  now: number = Date.now(),
): RoomAim | undefined {
  const root = findOpenspecRoot(cwd);
  if (!root) return undefined;
  const file = join(root, '.focus');
  let mtimeMs: number;
  try {
    mtimeMs = statSync(file).mtimeMs;
  } catch {
    if (
      cache &&
      'absentAt' in cache &&
      cache.path === file &&
      now - cache.absentAt < ABSENT_TTL_MS
    ) {
      return undefined;
    }
    cache = { path: file, absentAt: now };
    return undefined;
  }
  if (cache && 'aim' in cache && cache.path === file && cache.mtimeMs === mtimeMs) {
    return cache.aim;
  }
  let aim: RoomAim | undefined;
  try {
    aim = parseRoomAim(readFileSync(file, 'utf8'), mtimeMs);
  } catch {
    aim = undefined;
  }
  cache = { path: file, mtimeMs, aim };
  return aim;
}
