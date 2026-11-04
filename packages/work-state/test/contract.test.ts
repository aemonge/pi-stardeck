import assert from 'node:assert/strict';
import { test } from 'node:test';
// Test-level cross-package import: the runtime rule forbids cross-package
// imports in source; the suites are the contract-enforcement instrument.
import { OPEN_SPEC_FOCUS_ENTRY_TYPE as STATUS_FOCUS_ENTRY } from '../../status/src/active-work.ts';
import { OPEN_SPEC_FOCUS_ENTRY_TYPE as WORK_STATE_FOCUS_ENTRY } from '../src/focus.ts';

test('the frozen focus entry contract is byte-identical across packages', () => {
  assert.equal(WORK_STATE_FOCUS_ENTRY, STATUS_FOCUS_ENTRY);
  assert.equal(WORK_STATE_FOCUS_ENTRY, 'galactica-status.openspec-focus.v1');
});
