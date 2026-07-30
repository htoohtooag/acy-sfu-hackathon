import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePlatformFee, mapOrder } from '../src/features/transactions/order.service.js';

test('platform fee uses exact integer half up rounding', () => {
  assert.equal(calculatePlatformFee(1000n, { toString: () => '10.00' }), 100n);
  assert.equal(calculatePlatformFee(101n, { toString: () => '10.00' }), 10n);
  assert.equal(calculatePlatformFee(105n, { toString: () => '10.50' }), 11n);
});

test('order mapping serializes bigint and dates safely', () => {
  const result = mapOrder({
    id: 'order-id',
    client_id: 'client-id',
    freelancer_id: 'freelancer-id',
    source_type: 'PACKAGE',
    package_id: 'package-id',
    job_post_id: null,
    agreed_price_mmk: 150000n,
    platform_fee_mmk: 15000n,
    status: 'AWAITING_ESCROW',
    is_escrow_funded: false,
    created_at: new Date('2026-07-31T00:00:00.000Z'),
    updated_at: new Date('2026-07-31T00:00:00.000Z'),
  });

  assert.deepEqual(result.agreed_price_mmk, '150000');
  assert.deepEqual(result.platform_fee_mmk, '15000');
  assert.equal(result.created_at, '2026-07-31T00:00:00.000Z');
  assert.doesNotThrow(() => JSON.stringify(result));
});
