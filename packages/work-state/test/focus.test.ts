import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  NO_OPEN_SPEC_FOCUS,
  OPEN_SPEC_FOCUS_ENTRY_TYPE,
  parseOpenSpecFocus,
  restoreOpenSpecFocus,
  sameOpenSpecFocus,
  sameTaskFocus,
  taskFocus,
  taskflowRunFocus,
} from '../src/focus.ts';

test('the focus entry-type constant keeps its frozen contract name', () => {
  assert.equal(OPEN_SPEC_FOCUS_ENTRY_TYPE, 'galactica-status.openspec-focus.v1');
});

test('taskFocus normalizes identifiers and rejects empty or non-string ones', () => {
  const focus = taskFocus('  change-a  ', 'task-1');
  assert.deepEqual(focus, {
    mode: 'task',
    change: 'change-a',
    taskId: 'task-1',
    awaitingValidation: false,
  });
  assert.equal(taskFocus('', 'task-1'), undefined);
  assert.equal(taskFocus('change-a', '   '), undefined);
  assert.equal(taskFocus(42, 'task-1'), undefined);
  assert.equal(taskFocus('change-a', undefined), undefined);
  assert.equal(taskFocus('change-a', 'task-1', true)?.awaitingValidation, true);
  assert.equal(taskFocus('change-a', 'task-1', 'yes')?.awaitingValidation, false);
});

test('parseOpenSpecFocus round-trips task state and rejects malformed entries', () => {
  assert.equal(parseOpenSpecFocus({ mode: 'none' }), NO_OPEN_SPEC_FOCUS);
  const raw = { mode: 'task', change: 'c', taskId: 't', awaitingValidation: true };
  assert.deepEqual(parseOpenSpecFocus(raw), {
    mode: 'task',
    change: 'c',
    taskId: 't',
    awaitingValidation: true,
  });
  assert.equal(parseOpenSpecFocus(null), undefined);
  assert.equal(parseOpenSpecFocus('task'), undefined);
  assert.equal(parseOpenSpecFocus({ mode: 'other' }), undefined);
  assert.equal(parseOpenSpecFocus({ mode: 'task' }), undefined);
});

test('restoreOpenSpecFocus is latest-wins across mixed entries and fails soft', () => {
  const entries: unknown[] = [
    { type: 'custom', customType: OPEN_SPEC_FOCUS_ENTRY_TYPE, data: { mode: 'none' } },
    { type: 'message', content: 'noise' },
    {
      type: 'custom',
      customType: OPEN_SPEC_FOCUS_ENTRY_TYPE,
      data: { mode: 'task', change: 'old', taskId: 't1', awaitingValidation: false },
    },
    {
      type: 'custom',
      customType: OPEN_SPEC_FOCUS_ENTRY_TYPE,
      data: { mode: 'task', change: 'new', taskId: 't2', awaitingValidation: true },
    },
    { type: 'custom', customType: OPEN_SPEC_FOCUS_ENTRY_TYPE, data: 'garbage' },
  ];
  const focus = restoreOpenSpecFocus(entries);
  assert.equal(focus.mode, 'task');
  assert.ok(focus.mode === 'task' && focus.change === 'new' && focus.taskId === 't2');
  assert.equal(restoreOpenSpecFocus([]), NO_OPEN_SPEC_FOCUS);
  assert.equal(restoreOpenSpecFocus(['junk', 42]), NO_OPEN_SPEC_FOCUS);
  assert.equal(restoreOpenSpecFocus([null]), NO_OPEN_SPEC_FOCUS);
});

test('sameTaskFocus ignores the validation flag; sameOpenSpecFocus includes it', () => {
  const a = taskFocus('c', 't', false);
  const b = taskFocus('c', 't', true);
  assert.ok(a && b);
  assert.ok(sameTaskFocus(a, b));
  assert.ok(!sameOpenSpecFocus(a, b));
  assert.ok(sameOpenSpecFocus(NO_OPEN_SPEC_FOCUS, { mode: 'none' }));
  assert.ok(!sameTaskFocus(NO_OPEN_SPEC_FOCUS, a));
});

test('taskflowRunFocus extracts run-target focus and rejects none placeholders', () => {
  assert.deepEqual(
    taskflowRunFocus({
      action: 'run',
      args: { change: 'c', task: 't' },
    }),
    taskFocus('c', 't'),
  );
  assert.equal(
    taskflowRunFocus({
      action: 'run',
      args: { change: 'none', task: 'none' },
    }),
    undefined,
  );
  assert.equal(taskflowRunFocus({ action: 'status', args: {} }), undefined);
  assert.equal(taskflowRunFocus('run'), undefined);
});
