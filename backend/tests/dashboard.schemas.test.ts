import assert from 'node:assert/strict';
import test from 'node:test';
import { dashboardQuerySchema, dashboardSummarySchema } from 'shared/schemas';

const orderId = '00000000-0000-4000-8000-000000000001';
const participantId = '00000000-0000-4000-8000-000000000002';

test('dashboard query accepts one supported role and rejects unknown fields', () => {
  assert.deepEqual(dashboardQuerySchema.parse({ role: 'client' }), { role: 'client' });
  assert.equal(dashboardQuerySchema.safeParse({ role: 'admin' }).success, false);
  assert.equal(dashboardQuerySchema.safeParse({ role: 'client', page: '1' }).success, false);
});

test('dashboard summary requires three safe metrics and bounded attention items', () => {
  const result = dashboardSummarySchema.safeParse({
    role: 'freelancer',
    metrics: [
      { key: 'AWAITING_ESCROW', label: 'Waiting for escrow', count: 1 },
      { key: 'ACTIVE_WORK', label: 'Active work', count: 2 },
      { key: 'IN_REVIEW', label: 'Submitted for review', count: 0 },
    ],
    attention_items: [{
      order_id: orderId,
      title: 'Brand identity',
      source_type: 'PACKAGE',
      participant: { id: participantId, full_name: 'Client', avatar_url: null },
      status: 'ACTIVE',
      amount_mmk: '150000',
      updated_at: '2026-08-20T00:00:00.000Z',
      action: 'OPEN_WORKROOM',
    }],
  });

  assert.equal(result.success, true);
  assert.equal(dashboardSummarySchema.safeParse({ role: 'client', metrics: [], attention_items: [] }).success, false);
});
