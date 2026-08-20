import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleWorkOrderSchema, sampleWorkTextSchema, sampleWorkUpdateSchema } from 'shared/schemas';

test('sample work text accepts bounded metadata', () => {
  const result = sampleWorkTextSchema.parse({ title: 'Brand identity', description: 'A complete identity system.', tags: ['Branding', 'Figma'] });
  assert.deepEqual(result.tags, ['Branding', 'Figma']);
});

test('sample work text rejects oversized fields and too many tags', () => {
  assert.throws(() => sampleWorkTextSchema.parse({ title: 'x'.repeat(121), description: 'Description', tags: [] }));
  assert.throws(() => sampleWorkTextSchema.parse({ title: 'Title', description: 'x'.repeat(1001), tags: [] }));
  assert.throws(() => sampleWorkTextSchema.parse({ title: 'Title', description: 'Description', tags: Array.from({ length: 11 }, () => 'tag') }));
});

test('sample work order requires unique complete owner IDs', () => {
  const first = '00000000-0000-4000-8000-000000000001';
  const second = '00000000-0000-4000-8000-000000000002';
  assert.deepEqual(sampleWorkOrderSchema.parse({ sampleIds: [first, second] }).sampleIds, [first, second]);
  assert.throws(() => sampleWorkOrderSchema.parse({ sampleIds: [first, first] }));
  assert.throws(() => sampleWorkOrderSchema.parse({ sampleIds: [] }));
});

test('sample work update requires at least one editable field', () => {
  assert.deepEqual(sampleWorkUpdateSchema.parse({ title: 'New title' }), { title: 'New title' });
  assert.deepEqual(sampleWorkUpdateSchema.parse({}), {});
});
