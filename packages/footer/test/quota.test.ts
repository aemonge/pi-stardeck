import assert from 'node:assert/strict';
import test from 'node:test';

import { activeQuotaProviders, registerQuotaProvider } from '../src/quota.ts';

test('the quota seam ships empty', () => {
  assert.deepEqual(activeQuotaProviders(), []);
});

test('registerQuotaProvider appends once per id', () => {
  const provider = { id: 'test-quota', snapshot: () => undefined };
  registerQuotaProvider(provider);
  registerQuotaProvider(provider);
  assert.equal(
    activeQuotaProviders().filter(({ id }) => id === 'test-quota').length,
    1,
  );
});
