import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deliverableDecisionParamsSchema,
  deliverableDecisionSchema,
  deliverableOrderParamsSchema,
} from 'shared/schemas';

const orderId = '00000000-0000-4000-8000-000000000001';
const deliverableId = '00000000-0000-4000-8000-000000000002';

test('deliverable routes accept only UUID parameters', () => {
  assert.deepEqual(deliverableOrderParamsSchema.parse({ id: orderId }), { id: orderId });
  assert.deepEqual(deliverableDecisionParamsSchema.parse({ id: orderId, deliverableId }), {
    id: orderId,
    deliverableId,
  });
  assert.equal(deliverableOrderParamsSchema.safeParse({ id: 'not-a-uuid' }).success, false);
  assert.equal(deliverableDecisionParamsSchema.safeParse({ id: orderId, deliverableId: 'bad' }).success, false);
});

test('deliverable decisions reject client controlled state and URLs', () => {
  assert.deepEqual(deliverableDecisionSchema.parse({ action: 'APPROVE' }), { action: 'APPROVE' });
  assert.deepEqual(deliverableDecisionSchema.parse({ action: 'REJECT' }), { action: 'REJECT' });
  assert.equal(deliverableDecisionSchema.safeParse({ action: 'APPROVED' }).success, false);
  assert.equal(deliverableDecisionSchema.safeParse({ action: 'APPROVE', status: 'COMPLETED' }).success, false);
  assert.equal(deliverableDecisionSchema.safeParse({ action: 'APPROVE', clean_url: 'https://example.com' }).success, false);
});
