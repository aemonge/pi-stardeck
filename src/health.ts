import { constants } from 'node:fs';
import { access, readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { delimiter, dirname, isAbsolute, join, parse } from 'node:path';

import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from '@earendil-works/pi-coding-agent';

export type ExternalEditorHealth = 'ready' | 'missing' | 'unavailable';
export type StardeckHealthStatus = 'PASS' | 'WARN' | 'INFO';

export interface StardeckHealthEvidence {
  packageVersion: string;
  mode: string;
  hasUI: boolean;
  neovimTerminal: boolean;
  externalEditor: ExternalEditorHealth;
  commandNames: readonly string[];
  capabilities: {
    git: boolean;
    openspec: boolean;
    devbox: boolean;
    tmux: boolean;
  };
}

export interface StardeckHealthCheck {
  id:
    | 'package'
    | 'surface'
    | 'composer'
    | 'topology'
    | 'git'
    | 'openspec'
    | 'devbox'
    | 'tmux';
  status: StardeckHealthStatus;
  message: string;
}

export interface StardeckHealthReport {
  packageVersion: string;
  severity: 'info' | 'warning';
  checks: readonly StardeckHealthCheck[];
}

type HealthEvidenceProvider = (
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
) => Promise<StardeckHealthEvidence>;

type JsonSettings = { externalEditor?: unknown };

const PACKAGE_VERSION = (
  createRequire(import.meta.url)('../package.json') as { version: string }
).version;

const PACKAGE_COMMANDS = [
  'galactica-status',
  'galactica-status-debug',
  'galactica-status-refresh',
  'openspec-focus',
  'pi-status',
  'stardeck-health',
  'work',
] as const;

function check(
  id: StardeckHealthCheck['id'],
  status: StardeckHealthStatus,
  message: string,
): StardeckHealthCheck {
  return { id, status, message };
}

function hasDuplicateCockpitCommand(commandNames: readonly string[]): boolean {
  return commandNames.some((name) =>
    PACKAGE_COMMANDS.some((known) => new RegExp(`^${known}:\\d+$`, 'u').test(name)),
  );
}

export function evaluateStardeckHealth(
  evidence: StardeckHealthEvidence,
): StardeckHealthReport {
  const duplicate = hasDuplicateCockpitCommand(evidence.commandNames);
  const interactive = evidence.mode === 'tui' && evidence.hasUI;
  const checks: StardeckHealthCheck[] = [
    duplicate
      ? check('package', 'WARN', 'duplicate cockpit commands detected')
      : check('package', 'PASS', 'root command set is unique'),
    interactive
      ? check('surface', 'PASS', 'interactive TUI available')
      : check('surface', 'WARN', 'run Pi in interactive TUI mode'),
    evidence.externalEditor === 'ready'
      ? check('composer', 'PASS', 'external editor is configured and executable')
      : evidence.externalEditor === 'missing'
        ? check('composer', 'WARN', 'configure externalEditor for prompt composition')
        : check('composer', 'WARN', 'configured externalEditor is not executable'),
    evidence.neovimTerminal
      ? check('topology', 'PASS', 'Neovim terminal detected (recommended)')
      : check('topology', 'INFO', 'plain terminal detected (Neovim recommended)'),
  ];

  for (const id of ['git', 'openspec', 'devbox', 'tmux'] as const) {
    checks.push(
      check(
        id,
        'INFO',
        `${evidence.capabilities[id] ? 'available' : 'absent'} (optional)`,
      ),
    );
  }

  return {
    packageVersion: evidence.packageVersion,
    severity: checks.some(({ status }) => status === 'WARN') ? 'warning' : 'info',
    checks,
  };
}

export function formatStardeckHealth(report: StardeckHealthReport): string {
  const lines = [`pi-stardeck health ${report.packageVersion}`];
  for (const item of report.checks) {
    lines.push(`${item.status.padEnd(5)} ${item.id} · ${item.message}`);
  }
  return lines.join('\n');
}

async function readExternalEditor(path: string): Promise<string | undefined> {
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as JsonSettings;
    const value = parsed?.externalEditor;
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  } catch {
    return undefined;
  }
}

async function isExecutable(command: string, pathValue: string): Promise<boolean> {
  const candidates =
    isAbsolute(command) || command.includes('/')
      ? [command]
      : pathValue
          .split(delimiter)
          .filter(Boolean)
          .map((directory) => join(directory, command));

  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK);
      const metadata = await stat(candidate);
      if (metadata.isFile()) return true;
    } catch {
      // Keep searching the bounded PATH candidates.
    }
  }
  return false;
}

async function findAncestorEntry(start: string, entry: string): Promise<boolean> {
  let current = start;
  const root = parse(current).root;
  while (true) {
    try {
      await access(join(current, entry));
      return true;
    } catch {
      if (current === root) return false;
      current = dirname(current);
    }
  }
}

async function inspectExternalEditor(
  cwd: string,
  agentDir: string,
  pathValue: string,
): Promise<ExternalEditorHealth> {
  const projectEditor = await readExternalEditor(join(cwd, '.pi', 'settings.json'));
  const globalEditor = await readExternalEditor(join(agentDir, 'settings.json'));
  const command = projectEditor ?? globalEditor;
  if (!command) return 'missing';
  return (await isExecutable(command, pathValue)) ? 'ready' : 'unavailable';
}

export async function collectStardeckHealthEvidence(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
): Promise<StardeckHealthEvidence> {
  const agentDir = process.env.PI_CODING_AGENT_DIR ?? join(homedir(), '.pi', 'agent');
  const [externalEditor, git, openspec] = await Promise.all([
    inspectExternalEditor(ctx.cwd, agentDir, process.env.PATH ?? ''),
    findAncestorEntry(ctx.cwd, '.git'),
    findAncestorEntry(ctx.cwd, 'openspec'),
  ]);

  return {
    packageVersion: PACKAGE_VERSION,
    mode: ctx.mode,
    hasUI: ctx.hasUI,
    neovimTerminal: process.env.NVIM !== undefined,
    externalEditor,
    commandNames: pi.getCommands().map(({ name }) => name),
    capabilities: {
      git,
      openspec,
      devbox: process.env.DEVBOX_PROJECT_ROOT !== undefined,
      tmux: process.env.TMUX !== undefined,
    },
  };
}

export function registerStardeckHealth(
  pi: ExtensionAPI,
  provideEvidence: HealthEvidenceProvider = collectStardeckHealthEvidence,
): void {
  pi.registerCommand('stardeck-health', {
    description: 'Check pi-stardeck readiness and optional capabilities',
    handler: async (_args, ctx) => {
      const report = evaluateStardeckHealth(await provideEvidence(pi, ctx));
      ctx.ui.notify(formatStardeckHealth(report), report.severity);
    },
  });
}
