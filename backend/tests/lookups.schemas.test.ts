import test from 'node:test';
import assert from 'node:assert/strict';
import { packageTierLookupListSchema, packageTierLookupSchema } from 'shared/schemas';

test('package tier lookup schema accepts ordered active tier data', () => {
  const result = packageTierLookupListSchema.safeParse([
    { id: '00000000-0000-4000-8000-000000000001', name: 'BASIC', display_name: 'Basic', sort_order: 1 },
    { id: '00000000-0000-4000-8000-000000000002', name: 'STANDARD', display_name: 'Standard', sort_order: 2 },
  ]);

  assert.equal(result.success, true);
});

test('package tier lookup schema rejects invalid ids and negative ordering', () => {
  assert.equal(packageTierLookupSchema.safeParse({ id: 'not-a-uuid', name: 'BASIC', display_name: 'Basic', sort_order: 1 }).success, false);
  assert.equal(packageTierLookupSchema.safeParse({ id: '00000000-0000-4000-8000-000000000001', name: 'BASIC', display_name: 'Basic', sort_order: -1 }).success, false);
});
