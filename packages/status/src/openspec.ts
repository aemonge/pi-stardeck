import { promises as fs } from 'node:fs';
import { resolve, sep } from 'node:path';
import type {
  CommandRunner,
  OpenSpecArtifact,
  OpenSpecHierarchyProgress,
  OpenSpecOverview,
  OpenSpecState,
  OpenSpecTask,
} from './types.ts';

interface OpenSpecChangeRecord {
  name: string;
  completedTasks: number;
  totalTasks: number;
  lastModified: string;
  status: string;
}

interface OpenSpecListResult {
  changes: OpenSpecChangeRecord[];
  root?: { path?: string };
}

interface ApplyInstructionsResult {
  progress?: { total?: number; complete?: number };
  tasks: OpenSpecTask[];
  tasksPath?: string;
}

/** Parsed `openspec status` artifacts plus their resolved files. Paths stay
 *  internal: they feed the file-truth item counter, never the contract. */
interface ParsedArtifact extends OpenSpecArtifact {
  resolvedPath?: string;
}

interface ParsedOpenSpecStatus {
  schemaName?: string;
  artifacts?: ParsedArtifact[];
  currentArtifact?: string;
  changeRoot?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function safeJson(text: string, label: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${label} returned malformed JSON: ${message}`);
  }
}

export function parseOpenSpecList(value: unknown): OpenSpecListResult {
  if (!isRecord(value) || !Array.isArray(value.changes)) {
    throw new Error('OpenSpec list result has no changes array');
  }

  const changes: OpenSpecChangeRecord[] = [];
  for (const item of value.changes) {
    if (!isRecord(item) || typeof item.name !== 'string') continue;
    const completedTasks = finiteNumber(item.completedTasks);
    const totalTasks = finiteNumber(item.totalTasks);
    if (completedTasks === undefined || totalTasks === undefined) continue;
    changes.push({
      name: item.name,
      completedTasks: Math.max(0, Math.trunc(completedTasks)),
      totalTasks: Math.max(0, Math.trunc(totalTasks)),
      lastModified: typeof item.lastModified === 'string' ? item.lastModified : '',
      status: typeof item.status === 'string' ? item.status : 'unknown',
    });
  }

  const root =
    isRecord(value.root) && typeof value.root.path === 'string'
      ? { path: value.root.path }
      : undefined;
  return { changes, root };
}

function cleanTaskTitle(text: string): string {
  return text
    .replace(/\s+/gu, ' ')
    .replace(
      /\s+(?:Acceptance\/evidence|Acceptance\/ evidence|Acceptance|Evidence|Dependencies|Estimate):.*$/iu,
      '',
    )
    .trim()
    .replace(/[.:]\s*$/u, '');
}

export function parseTaskHeadline(
  description: string,
  fallbackId: string,
  done: boolean,
): OpenSpecTask {
  const normalized = description.replace(/\s+/gu, ' ').trim();
  const idMatch = normalized.match(/^(\d+(?:\.\d+)*)\s+(.+)$/u);
  const id = idMatch?.[1] ?? fallbackId;
  const body = idMatch?.[2] ?? normalized;
  const kindMatch = body.match(/\b(Story|Spike|Lab|Hack)\b/iu);
  const kindText = kindMatch?.[1];
  const kind = kindText
    ? ((kindText[0]?.toUpperCase() + kindText.slice(1).toLowerCase()) as
        'Story' | 'Spike' | 'Lab' | 'Hack')
    : undefined;
  const title = cleanTaskTitle(
    kindMatch?.index === undefined ? body : body.slice(0, kindMatch.index),
  );
  return { id, title: title || id, ...(kind ? { kind } : {}), done };
}

export function parseTaskMarkdown(content: string): OpenSpecTask[] {
  const tasks: OpenSpecTask[] = [];
  const pattern = /^\s*-\s*\[([ xX])\]\s+(.+)$/gmu;
  let match: RegExpExecArray | null;
  let ordinal = 0;
  while ((match = pattern.exec(content)) !== null) {
    ordinal += 1;
    tasks.push(
      parseTaskHeadline(match[2] ?? '', String(ordinal), (match[1] ?? '') !== ' '),
    );
  }
  return tasks;
}

/** File-truth checkbox counting: `{ done, total }` over `- [x]` / `- [ ]`
 *  items. Zero checkboxes is absence, not zero — `undefined` emits only
 *  when a readable source file actually carries countable items. */
export function parseCheckboxCounts(
  content: string,
): { done: number; total: number } | undefined {
  const pattern = /^\s*-\s*\[([ xX])\]/gmu;
  let total = 0;
  let done = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    total += 1;
    if ((match[1] ?? '').toLowerCase() === 'x') done += 1;
  }
  return total > 0 ? { done, total } : undefined;
}

/** mtime-keyed parse cache: a file is re-read only after its mtime moves.
 *  Unreadable files stay uncached so the next refresh retries honestly. */
const artifactItemsCache = new Map<
  string,
  { mtimeMs: number; counts: { done: number; total: number } | undefined }
>();

export async function readArtifactItems(
  path: string,
): Promise<{ done: number; total: number } | undefined> {
  let mtimeMs: number;
  try {
    mtimeMs = (await fs.stat(path)).mtimeMs;
  } catch {
    return undefined;
  }
  const cached = artifactItemsCache.get(path);
  if (cached && cached.mtimeMs === mtimeMs) return cached.counts;
  let counts: { done: number; total: number } | undefined;
  try {
    counts = parseCheckboxCounts(await fs.readFile(path, 'utf8'));
  } catch {
    return undefined;
  }
  artifactItemsCache.set(path, { mtimeMs, counts });
  return counts;
}

export function parseTaskHierarchy(
  content: string,
): OpenSpecHierarchyProgress | undefined {
  const tasks: Array<{
    id: string;
    completedSteps: number;
    totalSteps: number;
    validated: boolean;
  }> = [];
  let current: (typeof tasks)[number] | undefined;
  let inHumanValidation = false;

  for (const line of content.split(/\r?\n/u)) {
    const task = line.match(/^##\s+Task\s+([\w.-]+)\b/iu);
    if (task?.[1]) {
      current = {
        id: task[1],
        completedSteps: 0,
        totalSteps: 0,
        validated: false,
      };
      tasks.push(current);
      inHumanValidation = false;
      continue;
    }
    if (/^###\s+Human validation\b/iu.test(line)) {
      inHumanValidation = true;
      continue;
    }
    if (/^#{2,3}\s+/u.test(line)) inHumanValidation = false;
    if (!current) continue;

    const step = line.match(/^\s*-\s*\[([ xX-])\]\s+Step\s+/iu);
    if (step) {
      current.totalSteps += 1;
      if ((step[1] ?? '').toLowerCase() === 'x') current.completedSteps += 1;
      continue;
    }
    const validation = line.match(/^\s*-\s*\[([ xX-])\]\s+Human validates\b/iu);
    if (inHumanValidation && validation) {
      current.validated = (validation[1] ?? '').toLowerCase() === 'x';
    }
  }

  if (tasks.length === 0) return undefined;
  return {
    tasks: {
      completed: tasks.filter(
        (task) =>
          task.validated &&
          task.totalSteps > 0 &&
          task.completedSteps === task.totalSteps,
      ).length,
      total: tasks.length,
    },
    stepsByTask: Object.fromEntries(
      tasks.map((task) => [
        task.id,
        { completed: task.completedSteps, total: task.totalSteps },
      ]),
    ),
  };
}

export function parseApplyInstructions(value: unknown): ApplyInstructionsResult {
  if (!isRecord(value) || !Array.isArray(value.tasks)) {
    throw new Error('OpenSpec apply instructions have no tasks array');
  }

  const tasks = value.tasks.flatMap((item, index) => {
    if (!isRecord(item) || typeof item.description !== 'string') return [];
    return [
      parseTaskHeadline(
        item.description,
        typeof item.id === 'string' ? item.id : String(index + 1),
        item.done === true,
      ),
    ];
  });

  let tasksPath: string | undefined;
  if (isRecord(value.contextFiles) && Array.isArray(value.contextFiles.tasks)) {
    tasksPath = value.contextFiles.tasks.find(
      (path): path is string => typeof path === 'string',
    );
  }

  const state = typeof value.state === 'string' ? value.state : undefined;
  const reportedProgress = isRecord(value.progress)
    ? {
        total: finiteNumber(value.progress.total),
        complete: finiteNumber(value.progress.complete),
      }
    : undefined;
  // A blocked apply (mid-ladder, artifacts missing) reports zero progress;
  // those zeros must never shadow the honest `openspec list` counts.
  const progress =
    state !== 'blocked' && (reportedProgress?.total ?? 0) > 0
      ? reportedProgress
      : undefined;

  return { tasks, tasksPath, progress };
}

function chooseChange(
  list: OpenSpecListResult,
  configuredChange?: string | null,
  environmentChange?: string,
): OpenSpecChangeRecord | undefined {
  const requested = configuredChange || environmentChange;
  if (!requested) return undefined;

  const selected = list.changes.find((change) => change.name === requested);
  if (!selected) throw new Error(`configured OpenSpec change not found: ${requested}`);
  return selected;
}

function parseOpenSpecStatus(value: unknown): ParsedOpenSpecStatus {
  if (!isRecord(value)) return {};
  const schemaName =
    typeof value.schemaName === 'string' && value.schemaName.trim()
      ? value.schemaName.trim()
      : undefined;
  const changeRoot =
    typeof value.changeRoot === 'string' && value.changeRoot.trim()
      ? value.changeRoot.trim()
      : undefined;
  let artifacts: ParsedArtifact[] | undefined;
  let currentArtifact: string | undefined;
  if (Array.isArray(value.artifacts) && value.artifacts.length > 0) {
    const parsed: ParsedArtifact[] = [];
    let lastDone: string | undefined;
    for (const artifact of value.artifacts) {
      if (!isRecord(artifact)) continue;
      const id =
        typeof artifact.id === 'string' && artifact.id.trim()
          ? artifact.id.trim()
          : undefined;
      if (!id) continue;
      const done = artifact.status === 'done';
      if (done) lastDone = id;
      // The artifacts array carries a relative outputPath; the item counter
      // resolves it against the change root — contained paths only.
      let resolvedPath: string | undefined;
      const outputPath =
        typeof artifact.outputPath === 'string' && artifact.outputPath.trim()
          ? artifact.outputPath.trim()
          : undefined;
      if (changeRoot && outputPath) {
        const root = resolve(changeRoot);
        const candidate = resolve(root, outputPath);
        if (candidate === root || candidate.startsWith(`${root}${sep}`)) {
          resolvedPath = candidate;
        }
      }
      parsed.push({ id, done, ...(resolvedPath ? { resolvedPath } : {}) });
    }
    if (parsed.length > 0) {
      // The current artifact is the one the work is in: the first not yet
      // done; once everything is complete, the last done artifact.
      const inProgress = parsed.find((artifact) => !artifact.done);
      currentArtifact = inProgress ? inProgress.id : lastDone;
      artifacts = parsed;
    }
  }
  return {
    ...(schemaName ? { schemaName } : {}),
    ...(artifacts ? { artifacts } : {}),
    ...(currentArtifact ? { currentArtifact } : {}),
    ...(changeRoot ? { changeRoot } : {}),
  };
}

async function runJson(
  runner: CommandRunner,
  args: string[],
  cwd: string,
  label: string,
): Promise<unknown> {
  const result = await runner('openspec', args, { cwd, timeoutMs: 5_000 });
  if (result.code !== 0 || result.killed) {
    const detail = result.stderr.trim();
    throw new Error(`${label} failed${detail ? `: ${detail}` : ''}`);
  }
  return safeJson(result.stdout, label);
}

function fallbackTitle(changeId: string): string {
  return changeId.replaceAll('-', ' ');
}

async function isIdeaChange(projectRoot: string, changeName: string): Promise<boolean> {
  const changesRoot = resolve(projectRoot, 'openspec', 'changes');
  const changeRoot = resolve(changesRoot, changeName);
  if (changeRoot !== changesRoot && !changeRoot.startsWith(`${changesRoot}${sep}`)) {
    return false;
  }
  try {
    const metadata = await fs.readFile(resolve(changeRoot, '.openspec.yaml'), 'utf8');
    const schema = metadata.match(/^schema:\s*["']?([^\s"'#]+)/mu)?.[1];
    return schema === 'ramona-idea';
  } catch {
    // Generic OpenSpec changes have no Ramona Idea marker and count as Plans.
    return false;
  }
}

/** Newest mtime over the change directory's direct files — the file-truth
 *  "the change moved on" timestamp attention staleness compares against.
 *  Change directories are flat; absent or unreadable dirs stay undefined. */
async function changeDirectoryMtime(
  projectRoot: string,
  changeName: string,
): Promise<number | undefined> {
  const changesRoot = resolve(projectRoot, 'openspec', 'changes');
  const changeRoot = resolve(changesRoot, changeName);
  if (changeRoot !== changesRoot && !changeRoot.startsWith(`${changesRoot}${sep}`)) {
    return undefined;
  }
  let entries;
  try {
    entries = await fs.readdir(changeRoot, { withFileTypes: true });
  } catch {
    return undefined;
  }
  let newest: number | undefined;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    try {
      const mtimeMs = (await fs.stat(resolve(changeRoot, entry.name))).mtimeMs;
      newest = newest === undefined ? mtimeMs : Math.max(newest, mtimeMs);
    } catch {
      // A file vanishing between readdir and stat is honest absence.
    }
  }
  return newest;
}

export async function collectOpenSpecOverview(options: {
  cwd: string;
  runner: CommandRunner;
}): Promise<OpenSpecOverview> {
  const list = parseOpenSpecList(
    await runJson(options.runner, ['list', '--json'], options.cwd, 'openspec list'),
  );
  const projectRoot = list.root?.path ?? options.cwd;
  const ideaFlags = await Promise.all(
    list.changes.map((change) => isIdeaChange(projectRoot, change.name)),
  );
  const plans = list.changes.filter((_change, index) => !ideaFlags[index]);
  const completedPlans = plans.filter(
    (change) =>
      change.status === 'complete' ||
      (change.totalTasks > 0 && change.completedTasks >= change.totalTasks),
  ).length;

  return {
    projectRoot,
    actionableChanges: plans.filter(
      (change) => change.totalTasks > 0 && change.completedTasks < change.totalTasks,
    ).length,
    totalChanges: list.changes.length,
    completedPlans,
    totalPlans: plans.length,
    completedTasks: plans.reduce((total, change) => total + change.completedTasks, 0),
    totalTasks: plans.reduce((total, change) => total + change.totalTasks, 0),
  };
}

export async function collectOpenSpec(options: {
  cwd: string;
  runner: CommandRunner;
  configuredChange?: string | null;
  environmentChange?: string;
  now?: number;
}): Promise<OpenSpecState | undefined> {
  const now = options.now ?? Date.now();
  const list = parseOpenSpecList(
    await runJson(options.runner, ['list', '--json'], options.cwd, 'openspec list'),
  );
  const change = chooseChange(
    list,
    options.configuredChange,
    options.environmentChange,
  );
  if (!change) return undefined;

  const projectRoot = list.root?.path ?? options.cwd;
  let title = fallbackTitle(change.name);
  try {
    const shown = await runJson(
      options.runner,
      ['show', change.name, '--json'],
      projectRoot,
      'openspec show',
    );
    if (isRecord(shown) && typeof shown.title === 'string' && shown.title.trim()) {
      title = shown.title.trim();
    }
  } catch {
    // The list result is still useful when an optional title lookup fails.
  }

  let schemaName: string | undefined;
  let artifacts: OpenSpecArtifact[] | undefined;
  let currentArtifact: string | undefined;
  try {
    const status = parseOpenSpecStatus(
      await runJson(
        options.runner,
        ['status', '--change', change.name, '--json'],
        projectRoot,
        'openspec status',
      ),
    );
    schemaName = status.schemaName;
    currentArtifact = status.currentArtifact;
    if (status.artifacts) {
      // Item counts come from the artifact FILES, not CLI opinion: the CLI
      // cannot count custom-schema items (taskTrackingConfigured: false),
      // and only readable files emit counts — absence never becomes zero.
      artifacts = await Promise.all(
        status.artifacts.map(async (artifact) => {
          const items = artifact.resolvedPath
            ? await readArtifactItems(artifact.resolvedPath)
            : undefined;
          return {
            id: artifact.id,
            done: artifact.done,
            ...(items ? { items } : {}),
          };
        }),
      );
    }
  } catch {
    // Artifact facts are optional; the list counts remain valid without them.
  }
  const changeModifiedAt = await changeDirectoryMtime(projectRoot, change.name);

  let tasks: OpenSpecTask[] = [];
  let tasksPath: string | undefined;
  let hierarchy: OpenSpecHierarchyProgress | undefined;
  try {
    const instructions = parseApplyInstructions(
      await runJson(
        options.runner,
        ['instructions', 'apply', '--change', change.name, '--json'],
        projectRoot,
        'openspec instructions apply',
      ),
    );
    tasks = instructions.tasks;
    tasksPath = instructions.tasksPath;

    if (tasksPath) {
      try {
        const markdown = await fs.readFile(tasksPath, 'utf8');
        const markdownTasks = parseTaskMarkdown(markdown);
        if (markdownTasks.length > 0) tasks = markdownTasks;
        hierarchy = parseTaskHierarchy(markdown);
      } catch {
        // Instructions still provide a safe task fallback when the file moves.
      }
    }
  } catch {
    // Progress from `list` remains valid even if apply instructions are unavailable.
  }

  // File truth first: when the artifact (or apply) task list parsed, its
  // done flags are what the Human actually ticks — the CLI's done-counting
  // does not track custom-schema execution artifacts and pinned the Work
  // tile at 0/N (simplify-deck-defaults). CLI progress and list counts
  // remain fallbacks; the blocked-apply zero-guard stays for the
  // no-tasks case.
  // File-truth ladder: checkbox tasks first, then done/total artifacts
  // (file presence via `openspec status`) — CLI task opinion cannot count
  // custom schemas and pins 0/N (truthful-rendered-state). With neither
  // readable, counts stay absent — absence never becomes zero.
  const artifactCounts = artifacts
    ? {
        done: artifacts.filter((artifact) => artifact.done).length,
        total: artifacts.length,
      }
    : undefined;
  const completedTasks =
    tasks.length > 0 ? tasks.filter((task) => task.done).length : artifactCounts?.done;
  const totalTasks = tasks.length > 0 ? tasks.length : artifactCounts?.total;
  const complete =
    change.status === 'complete' ||
    (totalTasks !== undefined && totalTasks > 0 && (completedTasks ?? 0) >= totalTasks);

  return {
    projectRoot,
    changeId: change.name,
    title,
    phase: complete ? 'complete' : change.status,
    ...(completedTasks !== undefined ? { completedTasks } : {}),
    ...(totalTasks !== undefined ? { totalTasks } : {}),
    ...(totalTasks !== undefined && totalTasks > 0
      ? {
          progressPercent: Math.max(
            0,
            Math.min(100, Math.round(((completedTasks ?? 0) / totalTasks) * 100)),
          ),
        }
      : {}),
    pendingTasks: tasks.filter((task) => !task.done),
    allTasks: tasks,
    ...(tasksPath ? { tasksPath } : {}),
    ...(hierarchy ? { hierarchy } : {}),
    ...(schemaName ? { schemaName } : {}),
    ...(artifacts ? { artifacts } : {}),
    ...(currentArtifact ? { currentArtifact } : {}),
    ...(changeModifiedAt !== undefined ? { changeModifiedAt } : {}),
    meta: {
      source: 'openspec-cli',
      refreshedAt: now,
      attemptedAt: now,
      updatedAt: Date.parse(change.lastModified) || now,
      stale: false,
    },
  };
}
