import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createOrderSchema,
  orderListQuerySchema,
  orderQuoteRequestSchema,
  orderQuoteResponseSchema,
  paymentProofFieldsSchema,
} from 'shared/schemas';

test('package order accepts only its package source', () => {
  assert.equal(createOrderSchema.safeParse({ package_id: '00000000-0000-4000-8000-000000000001' }).success, true);
  assert.equal(createOrderSchema.safeParse({
    package_id: '00000000-0000-4000-8000-000000000001',
    job_post_id: '00000000-0000-4000-8000-000000000002',
  }).success, false);
});

test('custom offer order requires its freelancer and positive agreed amount', () => {
  const valid = createOrderSchema.safeParse({
    job_post_id: '00000000-0000-4000-8000-000000000001',
    freelancer_id: '00000000-0000-4000-8000-000000000002',
    agreed_price_mmk: '150000',
  });
  assert.equal(valid.success, true);
  assert.equal(createOrderSchema.safeParse({
    job_post_id: '00000000-0000-4000-8000-000000000001',
    freelancer_id: '00000000-0000-4000-8000-000000000002',
    agreed_price_mmk: '0',
  }).success, false);
});

test('payment proof fields reject client controlled transaction state', () => {
  assert.equal(paymentProofFieldsSchema.safeParse({
    amount_mmk: '150000',
    payment_method_id: '00000000-0000-4000-8000-000000000001',
    status: 'VERIFIED',
  }).success, false);
});

test('order list query requires a supported role and accepts a supported status', () => {
  assert.deepEqual(orderListQuerySchema.parse({ role: 'client', status: 'in_review' }), {
    role: 'client',
    status: 'in_review',
  });
  assert.equal(orderListQuerySchema.safeParse({ role: 'admin' }).success, false);
  assert.equal(orderListQuerySchema.safeParse({ role: 'client', status: 'active', page: '1' }).success, false);
});

test('order quote schemas keep package ids and money values strict', () => {
  assert.equal(orderQuoteRequestSchema.safeParse({
    package_id: '00000000-0000-4000-8000-000000000001',
  }).success, true);
  assert.equal(orderQuoteResponseSchema.safeParse({
    package_id: '00000000-0000-4000-8000-000000000001',
    agreed_price_mmk: '150000',
    platform_fee_mmk: '15000',
  }).success, true);
  assert.equal(orderQuoteRequestSchema.safeParse({
    package_id: '00000000-0000-4000-8000-000000000001',
    platform_fee_mmk: '1',
  }).success, false);
  assert.equal(orderQuoteResponseSchema.safeParse({
    package_id: '00000000-0000-4000-8000-000000000001',
    agreed_price_mmk: '150000',
    platform_fee_mmk: '-1',
  }).success, false);
});
