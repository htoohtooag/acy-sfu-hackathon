import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapModeration,
  mapPaymentRejection,
  mapPaymentVerification,
} from '../src/features/admin/admin.service.js';

test('verified payment response is safe for JSON and excludes the screenshot path', () => {
  const result = mapPaymentVerification({
    id: 'payment-id',
    order_id: 'order-id',
    amount_mmk: 150000n,
    status: 'VERIFIED',
    rejection_reason: null,
    verified_by: 'admin-id',
    verified_at: new Date('2026-07-31T00:00:00.000Z'),
    order: {
      id: 'order-id',
      client_id: 'client-id',
      freelancer_id: 'freelancer-id',
      status: 'ACTIVE',
      is_escrow_funded: true,
      deleted_at: null,
    },
  });

  assert.equal(result.amount_mmk, '150000');
  assert.equal(result.order_status, 'ACTIVE');
  assert.equal('screenshot_url' in result, false);
  assert.doesNotThrow(() => JSON.stringify(result));
});

test('rejected payment response preserves the locked order and reason', () => {
  const result = mapPaymentRejection({
    id: 'payment-id',
    order_id: 'order-id',
    amount_mmk: 150000n,
    status: 'REJECTED',
    rejection_reason: 'Payment proof is not valid.',
    verified_by: null,
    verified_at: null,
    order: {
      id: 'order-id',
      client_id: 'client-id',
      freelancer_id: 'freelancer-id',
      status: 'AWAITING_ESCROW',
      is_escrow_funded: false,
      deleted_at: null,
    },
  });

  assert.deepEqual(result, {
    payment_id: 'payment-id',
    order_id: 'order-id',
    amount_mmk: '150000',
    payment_status: 'REJECTED',
    rejection_reason: 'Payment proof is not valid.',
    order_status: 'AWAITING_ESCROW',
    is_escrow_funded: false,
  });
  assert.doesNotThrow(() => JSON.stringify(result));
});

test('moderation response contains the suspended state and serializes dates', () => {
  const result = mapModeration({
    id: 'moderation-id',
    user_id: 'target-id',
    reason: 'Policy violation',
    status: 'ACTIVE',
    created_at: new Date('2026-07-31T00:00:00.000Z'),
  });

  assert.deepEqual(result, {
    moderation_id: 'moderation-id',
    target_user_id: 'target-id',
    moderation_status: 'ACTIVE',
    user_status: 'SUSPENDED',
    reason: 'Policy violation',
    created_at: '2026-07-31T00:00:00.000Z',
  });
});
