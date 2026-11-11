import assert from 'node:assert/strict';
import {
  mkdir,
  mkdtemp,
  rm,
  stat as fsStat,
  utimes,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  collectOpenSpec,
  collectOpenSpecOverview,
  parseCheckboxCounts,
  parseOpenSpecList,
  parseTaskHierarchy,
  parseTaskMarkdown,
  readArtifactItems,
} from '../src/openspec.ts';
import type { CommandRunner } from '../src/types.ts';

test('extracts OpenSpec task counts and pending story titles', () => {
  const tasks = parseTaskMarkdown(`
# Tasks
- [x] 1.1 Discovery Spike. Acceptance: done
- [ ] 2.1 Build publisher Story. User need: compact status
- [ ] 2.2 Verify reload behavior
`);

  assert.equal(tasks.length, 3);
  assert.equal(tasks.filter((task) => task.done).length, 1);
  assert.deepEqual(tasks[1], {
    id: '2.1',
    title: 'Build publisher',
    kind: 'Story',
    done: false,
  });
});

test('extracts bounded Ramona Task and focused Step progress', () => {
  const hierarchy = parseTaskHierarchy(`
## Task 1 — First value
- [x] Step 1.1 Build it
- [-] Step 1.2 Check it
### Human validation
- [ ] Human validates first value

## Task 2 — Accepted value
- [x] Step 2.1 Build it
### Human validation
- [x] Human validates second value
`);

  assert.deepEqual(hierarchy, {
    tasks: { completed: 1, total: 2 },
    stepsByTask: {
      '1': { completed: 1, total: 2 },
      '2': { completed: 1, total: 1 },
    },
  });
});

test('preserves focus task IDs when headlines contain child Step labels', () => {
  const tasks = parseTaskMarkdown(`
- [ ] Step 1.1 Create root-level \`greeting.txt\` with exact contents
- [ ] Task 2.3 Verify the focused footer
`);

  assert.deepEqual(tasks, [
    {
      id: '1',
      title: 'Step 1.1 Create root-level `greeting.txt` with exact contents',
      done: false,
    },
    {
      id: '2',
      title: 'Task 2.3 Verify the focused footer',
      done: false,
    },
  ]);
});

test('malformed Markdown produces no tasks without throwing', () => {
  assert.deepEqual(parseTaskMarkdown('# Tasks\nnot a checklist\n- [maybe] nope'), []);
});

test('OpenSpec list rejects malformed structures', () => {
  assert.throws(() => parseOpenSpecList({ changes: 'nope' }), /changes array/);
});

test('OpenSpec overview aggregates Plans and Tasks while excluding Ramona Ideas', async () => {
  const root = await mkdtemp(join(tmpdir(), 'galactica-openspec-overview-'));
  await mkdir(join(root, 'openspec', 'changes', 'idea'), { recursive: true });
  await writeFile(
    join(root, 'openspec', 'changes', 'idea', '.openspec.yaml'),
    'schema: ramona-idea\n',
    'utf8',
  );
  const overview = async (changes: unknown[]) =>
    collectOpenSpecOverview({
      cwd: root,
      runner: async () => ({
        code: 0,
        stdout: JSON.stringify({ changes, root: { path: root } }),
        stderr: '',
      }),
    });

  try {
    assert.deepEqual(
      await overview([
        {
          name: 'active',
          completedTasks: 1,
          totalTasks: 2,
          lastModified: '',
          status: 'in-progress',
        },
        {
          name: 'idea',
          completedTasks: 0,
          totalTasks: 0,
          lastModified: '',
          status: 'no-tasks',
        },
      ]),
      {
        projectRoot: root,
        actionableChanges: 1,
        totalChanges: 2,
        completedPlans: 0,
        totalPlans: 1,
        completedTasks: 1,
        totalTasks: 2,
      },
    );
    assert.deepEqual(
      await overview([
        {
          name: 'complete',
          completedTasks: 2,
          totalTasks: 2,
          lastModified: '',
          status: 'complete',
        },
      ]),
      {
        projectRoot: root,
        actionableChanges: 0,
        totalChanges: 1,
        completedPlans: 1,
        totalPlans: 1,
        completedTasks: 2,
        totalTasks: 2,
      },
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('missing task file falls back to apply-instruction tasks', async () => {
  const root = await mkdtemp(join(tmpdir(), 'galactica-openspec-'));
  const missingTasks = join(root, 'openspec', 'changes', 'demo', 'tasks.md');
  const runner: CommandRunner = async (_command, args) => {
    const subcommand = args[0];
    if (subcommand === 'list') {
      return {
        code: 0,
        stdout: JSON.stringify({
          changes: [
            {
              name: 'demo',
              completedTasks: 1,
              totalTasks: 2,
              lastModified: '2026-01-01T00:00:00Z',
              status: 'in-progress',
            },
          ],
          root: { path: root },
        }),
        stderr: '',
      };
    }
    if (subcommand === 'show') {
      return {
        code: 0,
        stdout: JSON.stringify({ id: 'demo', title: 'Build a demo' }),
        stderr: '',
      };
    }
    return {
      code: 0,
      stdout: JSON.stringify({
        progress: { total: 2, complete: 1 },
        contextFiles: { tasks: [missingTasks] },
        tasks: [
          { id: '1', description: '1.1 Setup Story', done: true },
          { id: '2', description: '1.2 Publish status Story', done: false },
        ],
      }),
      stderr: '',
    };
  };

  try {
    const state = await collectOpenSpec({
      cwd: root,
      runner,
      now: 100,
      configuredChange: 'demo',
    });
    assert.equal(state?.completedTasks, 1);
    assert.equal(state?.totalTasks, 2);
    assert.equal(state?.pendingTasks[0]?.id, '1.2');
    assert.equal(state?.pendingTasks[0]?.title, 'Publish status');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('shows a newly created incomplete change before tasks exist', async () => {
  const root = await mkdtemp(join(tmpdir(), 'galactica-openspec-'));
  const runner: CommandRunner = async (_command, args) => {
    if (args[0] === 'list') {
      return {
        code: 0,
        stdout: JSON.stringify({
          changes: [
            {
              name: 'a',
              completedTasks: 0,
              totalTasks: 0,
              lastModified: '2026-01-01T00:00:00Z',
              status: 'no-tasks',
            },
          ],
          root: { path: root },
        }),
        stderr: '',
      };
    }
    if (args[0] === 'show') {
      return { code: 0, stdout: JSON.stringify({ title: 'a' }), stderr: '' };
    }
    return { code: 1, stdout: '', stderr: 'artifacts are not ready' };
  };

  try {
    const state = await collectOpenSpec({
      cwd: root,
      runner,
      configuredChange: 'a',
    });
    assert.equal(state?.changeId, 'a');
    assert.equal(state?.phase, 'no-tasks');
    // No tasks and no artifact facts: counts stay absent — never 0/0.
    assert.equal('completedTasks' in (state ?? {}), false);
    assert.equal('totalTasks' in (state ?? {}), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('malformed task file preserves the instruction fallback', async () => {
  const root = await mkdtemp(join(tmpdir(), 'galactica-openspec-'));
  const tasksPath = join(root, 'tasks.md');
  await writeFile(tasksPath, 'not a task list', 'utf8');
  const runner: CommandRunner = async (_command, args) => {
    if (args[0] === 'list') {
      return {
        code: 0,
        stdout: JSON.stringify({
          changes: [
            {
              name: 'demo',
              completedTasks: 0,
              totalTasks: 1,
              lastModified: '2026-01-01T00:00:00Z',
              status: 'in-progress',
            },
          ],
          root: { path: root },
        }),
        stderr: '',
      };
    }
    if (args[0] === 'show') {
      return { code: 0, stdout: JSON.stringify({ title: 'Demo' }), stderr: '' };
    }
    return {
      code: 0,
      stdout: JSON.stringify({
        contextFiles: { tasks: [tasksPath] },
        tasks: [{ id: '1', description: '1.1 Real task Story', done: false }],
      }),
      stderr: '',
    };
  };

  try {
    const state = await collectOpenSpec({
      cwd: root,
      runner,
      configuredChange: 'demo',
    });
    assert.equal(state?.pendingTasks[0]?.title, 'Real task');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('ticked execution artifacts count even when CLI progress says zero', async () => {
  // The 0/N repro (simplify-deck-defaults): the CLI's done-counting does
  // not track custom-schema execution artifacts — the file the Human
  // ticks is the truth, and its done flags must win.
  const root = await mkdtemp(join(tmpdir(), 'galactica-openspec-'));
  const executePath = join(root, '4-execute.md');
  await writeFile(
    executePath,
    `# Execute\n\n## Slice 1 — first\n\n- [x] extend the focus type\n- [x] parse round-trip\n- [x] validate action\n- [ ] runtime projection\n\n## Slice 2 — second\n\n- [ ] description simplified\n`,
    'utf8',
  );
  const runner: CommandRunner = async (_command, args) => {
    if (args[0] === 'list') {
      return {
        code: 0,
        stdout: JSON.stringify({
          changes: [
            {
              name: 'demo',
              completedTasks: 0,
              totalTasks: 9,
              lastModified: '2026-01-01T00:00:00Z',
              status: 'in-progress',
            },
          ],
          root: { path: root },
        }),
        stderr: '',
      };
    }
    if (args[0] === 'show') {
      return { code: 0, stdout: JSON.stringify({ title: 'Demo' }), stderr: '' };
    }
    return {
      code: 0,
      stdout: JSON.stringify({
        progress: { total: 9, complete: 0 },
        contextFiles: { tasks: [executePath] },
        tasks: [{ id: '1', description: '1 extend the focus type', done: false }],
      }),
      stderr: '',
    };
  };

  try {
    const state = await collectOpenSpec({
      cwd: root,
      runner,
      now: 100,
      configuredChange: 'demo',
    });
    assert.equal(state?.completedTasks, 3);
    assert.equal(state?.totalTasks, 5);
    assert.equal(state?.progressPercent, 60);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('blocked apply with no readable facts keeps counts absent', async () => {
  const root = await mkdtemp(join(tmpdir(), 'galactica-openspec-'));
  const runner: CommandRunner = async (_command, args) => {
    if (args[0] === 'list') {
      return {
        code: 0,
        stdout: JSON.stringify({
          changes: [
            {
              name: 'demo',
              completedTasks: 4,
              totalTasks: 7,
              lastModified: '2026-01-01T00:00:00Z',
              status: 'in-progress',
            },
          ],
          root: { path: root },
        }),
        stderr: '',
      };
    }
    if (args[0] === 'show') {
      return { code: 0, stdout: JSON.stringify({ title: 'Demo' }), stderr: '' };
    }
    return {
      code: 0,
      stdout: JSON.stringify({
        state: 'blocked',
        missingArtifacts: ['idea'],
        progress: { total: 0, complete: 0, remaining: 0 },
        tasks: [],
      }),
      stderr: '',
    };
  };

  try {
    const state = await collectOpenSpec({
      cwd: root,
      runner,
      now: 100,
      configuredChange: 'demo',
    });
    assert.equal(state?.changeId, 'demo');
    // No tasks and no artifact facts: the CLI's list opinion stays OUT of
    // the state — it cannot back a rendered count (truthful-rendered-state).
    assert.equal('completedTasks' in (state ?? {}), false);
    assert.equal('totalTasks' in (state ?? {}), false);
    assert.equal(state?.phase, 'in-progress');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('collects artifacts, currentArtifact, and file-truth item counts', async () => {
  const root = await mkdtemp(join(tmpdir(), 'galactica-openspec-'));
  const changeDir = join(root, 'openspec', 'changes', 'demo');
  await mkdir(changeDir, { recursive: true });
  // Checkbox files: idea complete, requirements complete, research in
  // flight with one unchecked item. The CLI cannot count these — the
  // collector reads the FILES (status JSON carries no item counts).
  await writeFile(
    join(changeDir, 'idea.md'),
    '- [x] seed the idea\n- [x] frame the pain\n',
  );
  await writeFile(join(changeDir, 'requirements.md'), '- [x] list requirements\n');
  await writeFile(
    join(changeDir, 'research.md'),
    '# Research\n\n- [x] first finding\n- [ ] open question\n\nNo checkboxes here:\nplain prose line\n',
  );
  const runner: CommandRunner = async (_command, args) => {
    if (args[0] === 'list') {
      return {
        code: 0,
        stdout: JSON.stringify({
          changes: [
            {
              name: 'demo',
              completedTasks: 4,
              totalTasks: 14,
              lastModified: '2026-01-01T00:00:00Z',
              status: 'in-progress',
            },
          ],
          root: { path: root },
        }),
        stderr: '',
      };
    }
    if (args[0] === 'show') {
      return { code: 0, stdout: JSON.stringify({ title: 'Demo' }), stderr: '' };
    }
    if (args[0] === 'status') {
      return {
        code: 0,
        stdout: JSON.stringify({
          schemaName: 'spec',
          changeRoot: changeDir,
          artifacts: [
            { id: 'idea', status: 'done', outputPath: 'idea.md' },
            { id: 'requirements', status: 'done', outputPath: 'requirements.md' },
            { id: 'research', status: 'ready', outputPath: 'research.md' },
          ],
        }),
        stderr: '',
      };
    }
    return {
      code: 0,
      stdout: JSON.stringify({
        state: 'blocked',
        progress: { total: 0, complete: 0, remaining: 0 },
        tasks: [],
      }),
      stderr: '',
    };
  };

  try {
    const state = await collectOpenSpec({
      cwd: root,
      runner,
      now: 100,
      configuredChange: 'demo',
    });
    assert.equal(state?.schemaName, 'spec');
    // Current artifact = the first not-yet-done (research), not the last
    // done one — the work is IN research at 2/3.
    assert.equal(state?.currentArtifact, 'research');
    assert.deepEqual(state?.artifacts, [
      { id: 'idea', done: true, items: { done: 2, total: 2 } },
      { id: 'requirements', done: true, items: { done: 1, total: 1 } },
      { id: 'research', done: false, items: { done: 1, total: 2 } },
    ]);
    // Artifact file presence is the count truth on checkbox-less schemas:
    // 2 done of 3 artifacts (truthful-rendered-state).
    assert.equal(state?.completedTasks, 2);
    assert.equal(state?.totalTasks, 3);
    assert.equal(state?.progressPercent, 67);
    // The change directory's newest file mtime feeds attention staleness.
    const stat = await fsStat(join(changeDir, 'research.md'));
    assert.equal(state?.changeModifiedAt, stat.mtimeMs);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('unreadable or empty artifact files emit no item counts — never zeros', async () => {
  const root = await mkdtemp(join(tmpdir(), 'galactica-openspec-'));
  await writeFile(join(root, 'empty.md'), 'plain prose, no checkboxes\n');
  let allDone = false;
  const runner: CommandRunner = async (_command, args) => {
    if (args[0] === 'list') {
      return {
        code: 0,
        stdout: JSON.stringify({
          changes: [
            {
              name: 'demo',
              completedTasks: 0,
              totalTasks: 0,
              lastModified: '2026-01-01T00:00:00Z',
              status: 'no-tasks',
            },
          ],
          root: { path: root },
        }),
        stderr: '',
      };
    }
    if (args[0] === 'show') {
      return { code: 0, stdout: JSON.stringify({ title: 'Demo' }), stderr: '' };
    }
    if (args[0] === 'status') {
      return {
        code: 0,
        stdout: JSON.stringify({
          schemaName: 'spec',
          changeRoot: root,
          artifacts: [
            { id: 'empty', status: allDone ? 'done' : 'ready', outputPath: 'empty.md' },
            {
              id: 'ghost',
              status: allDone ? 'done' : 'ready',
              outputPath: 'missing.md',
            },
            { id: 'pathless', status: 'done' },
          ],
        }),
        stderr: '',
      };
    }
    return {
      code: 0,
      stdout: JSON.stringify({
        state: 'ready',
        progress: { total: 0, complete: 0, remaining: 0 },
        tasks: [],
      }),
      stderr: '',
    };
  };

  try {
    const state = await collectOpenSpec({
      cwd: root,
      runner,
      now: 100,
      configuredChange: 'demo',
    });
    // First not-yet-done wins while work remains; nothing invents 0/0.
    assert.equal(state?.currentArtifact, 'empty');
    assert.deepEqual(state?.artifacts, [
      { id: 'empty', done: false },
      { id: 'ghost', done: false },
      { id: 'pathless', done: true },
    ]);
    // The artifact counts: one done of three artifacts — file presence.
    assert.equal(state?.completedTasks, 1);
    assert.equal(state?.totalTasks, 3);
    // Once everything is done, the fallback names the last done artifact.
    allDone = true;
    const finished = await collectOpenSpec({
      cwd: root,
      runner,
      now: 200,
      configuredChange: 'demo',
    });
    assert.equal(finished?.currentArtifact, 'pathless');
    // Everything done: 3/3 from file presence, and the change completes.
    assert.equal(finished?.completedTasks, 3);
    assert.equal(finished?.totalTasks, 3);
    assert.equal(finished?.phase, 'complete');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('parseCheckboxCounts counts only checkbox items and treats zero as absence', () => {
  assert.deepEqual(parseCheckboxCounts('- [x] done\n- [ ] open\n- [X] also done\n'), {
    done: 2,
    total: 3,
  });
  assert.equal(parseCheckboxCounts('no checkboxes at all\njust prose\n'), undefined);
  assert.equal(parseCheckboxCounts(''), undefined);
  // Indented and tilde-adjacent forms still count as checkbox items.
  assert.deepEqual(parseCheckboxCounts('  - [x] nested done\n\t- [ ] nested open'), {
    done: 1,
    total: 2,
  });
  assert.deepEqual(parseCheckboxCounts('- [x] a\n- [x] b\n- [x] c\n- [x] d'), {
    done: 4,
    total: 4,
  });
});

test('readArtifactItems caches by mtime and retries unreadable files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'galactica-openspec-'));
  const file = join(root, 'execute.md');
  // Exact millisecond timestamps: utimes round-trips whole ms faithfully,
  // so the cache hit is deterministic.
  const original = new Date(1_700_000_000_000);
  await writeFile(file, '- [x] one\n- [ ] two\n');
  await utimes(file, original, original);
  assert.deepEqual(await readArtifactItems(file), { done: 1, total: 2 });
  // Same mtime → cache hit (even if content changed underneath).
  await writeFile(file, '- [x] one\n- [x] two\n- [x] three\n');
  await utimes(file, original, original);
  assert.deepEqual(await readArtifactItems(file), { done: 1, total: 2 });
  // Moved mtime → honest re-read.
  const moved = new Date(1_700_000_500_000);
  await utimes(file, moved, moved);
  assert.deepEqual(await readArtifactItems(file), { done: 3, total: 3 });
  // Unreadable paths stay undefined without throwing.
  assert.equal(await readArtifactItems(join(root, 'missing.md')), undefined);
  await rm(root, { recursive: true, force: true });
});

test('spec schema with one artifact drafted counts 1/4 from file presence', async () => {
  // Live-caught 2026-11-10 (lab cold room): the CLI pinned 0/4 on the
  // spec schema; the artifact counts read the drafted file instead.
  const root = await mkdtemp(join(tmpdir(), 'galactica-openspec-'));
  const changeDir = join(root, 'openspec', 'changes', 'lab-run');
  await mkdir(changeDir, { recursive: true });
  await writeFile(join(changeDir, '1-brainstorm.md'), '# Brainstorm\n');
  const runner: CommandRunner = async (_command, args) => {
    if (args[0] === 'list') {
      return {
        code: 0,
        stdout: JSON.stringify({
          changes: [
            {
              name: 'lab-run',
              completedTasks: 0,
              totalTasks: 4,
              lastModified: '2026-01-01T00:00:00Z',
              status: 'proposed',
            },
          ],
          root: { path: root },
        }),
        stderr: '',
      };
    }
    if (args[0] === 'show') {
      return { code: 0, stdout: JSON.stringify({ title: 'Lab run' }), stderr: '' };
    }
    if (args[0] === 'status') {
      return {
        code: 0,
        stdout: JSON.stringify({
          schemaName: 'spec',
          changeRoot: changeDir,
          artifacts: [
            { id: 'brainstorm', status: 'done', outputPath: '1-brainstorm.md' },
            { id: 'investigate', status: 'ready' },
            { id: 'plan', status: 'blocked' },
            { id: 'execute', status: 'blocked' },
          ],
        }),
        stderr: '',
      };
    }
    return {
      code: 0,
      stdout: JSON.stringify({ state: 'blocked', tasks: [] }),
      stderr: '',
    };
  };

  try {
    const state = await collectOpenSpec({
      cwd: root,
      runner,
      now: 100,
      configuredChange: 'lab-run',
    });
    assert.equal(state?.currentArtifact, 'investigate');
    assert.equal(state?.completedTasks, 1);
    assert.equal(state?.totalTasks, 4);
    assert.equal(state?.progressPercent, 25);
    assert.equal(state?.phase, 'proposed');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
