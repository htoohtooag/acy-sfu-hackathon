import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adminEmptyBodySchema,
  adminPaymentIdSchema,
  moderationRequestSchema,
  moderationTargetIdSchema,
  paymentDecisionSchema,
} from 'shared/schemas';

const id = '00000000-0000-4000-8000-000000000001';

test('admin route schemas accept UUID parameters and an empty verification body', () => {
  assert.equal(adminPaymentIdSchema.safeParse({ id }).success, true);
  assert.equal(moderationTargetIdSchema.safeParse({ id }).success, true);
  assert.deepEqual(adminEmptyBodySchema.parse(undefined), {});
});

test('moderation schema requires a bounded reason and rejects client controlled fields', () => {
  assert.equal(moderationRequestSchema.safeParse({ reason: 'Policy violation' }).success, true);
  assert.equal(moderationRequestSchema.safeParse({ reason: '   ' }).success, false);
  assert.equal(moderationRequestSchema.safeParse({ reason: 'Policy violation', status: 'ACTIVE' }).success, false);
  assert.equal(moderationRequestSchema.safeParse({ reason: 'x'.repeat(1001) }).success, false);
});

test('payment decision accepts legacy and explicit verification and bounded rejection', () => {
  assert.deepEqual(paymentDecisionSchema.parse({}), { action: 'VERIFY' });
  assert.deepEqual(paymentDecisionSchema.parse({ action: 'VERIFY' }), { action: 'VERIFY' });
  assert.deepEqual(paymentDecisionSchema.parse({
    action: 'REJECT',
    reason: 'Payment proof is not valid.',
  }), {
    action: 'REJECT',
    reason: 'Payment proof is not valid.',
  });
  assert.equal(paymentDecisionSchema.safeParse({ action: 'REJECT', reason: ' ' }).success, false);
  assert.equal(paymentDecisionSchema.safeParse({ action: 'REJECT', reason: 'x', status: 'REJECTED' }).success, false);
});

test('admin UUID schemas reject malformed route parameters', () => {
  assert.equal(adminPaymentIdSchema.safeParse({ id: 'not-a-uuid' }).success, false);
  assert.equal(moderationTargetIdSchema.safeParse({ id: 'not-a-uuid' }).success, false);
});
