import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePlatformFee, mapOrder } from '../src/features/transactions/order.service.js';
import { mapOrderDetail, mapOrderListItem } from '../src/features/transactions/order.types.js';

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

test('order list mapping selects the other party and source title safely', () => {
  const record = {
    id: 'order-id',
    client_id: 'client-id',
    freelancer_id: 'freelancer-id',
    source_type: 'PACKAGE',
    package_id: 'package-id',
    job_post_id: null,
    agreed_price_mmk: 150000n,
    platform_fee_mmk: 15000n,
    status: 'ACTIVE',
    is_escrow_funded: true,
    created_at: new Date('2026-07-31T00:00:00.000Z'),
    updated_at: new Date('2026-07-31T00:00:00.000Z'),
    client: { id: 'client-id', full_name: 'Client', avatar_url: null },
    freelancer: { id: 'freelancer-id', full_name: 'Freelancer', avatar_url: 'avatar' },
    package: { id: 'package-id', title: 'Design', deleted_at: null },
    job_post: null,
  } satisfies Parameters<typeof mapOrderListItem>[0];

  const result = mapOrderListItem(record, 'client');
  assert.equal(result.freelancer.id, 'freelancer-id');
  assert.equal(result.other_party.id, 'freelancer-id');
  assert.deepEqual(result.source, { id: 'package-id', title: 'Design' });
  assert.equal(result.agreed_price_mmk, '150000');
  assert.doesNotThrow(() => JSON.stringify(result));
});

test('order detail mapping excludes private delivery paths and serializes values', () => {
  const record = {
    id: 'order-id',
    client_id: 'client-id',
    freelancer_id: 'freelancer-id',
    source_type: 'CUSTOM_OFFER',
    package_id: null,
    job_post_id: 'job-id',
    agreed_price_mmk: 200000n,
    platform_fee_mmk: 20000n,
    status: 'IN_REVIEW',
    is_escrow_funded: true,
    created_at: new Date('2026-07-31T00:00:00.000Z'),
    updated_at: new Date('2026-07-31T00:00:00.000Z'),
    client: { id: 'client-id', full_name: 'Client', avatar_url: null },
    freelancer: { id: 'freelancer-id', full_name: 'Freelancer', avatar_url: null },
    package: null,
    job_post: {
      id: 'job-id',
      title: 'Landing page',
      description: 'Build a landing page.',
      budget_min_mmk: 100000n,
      budget_max_mmk: 250000n,
      deleted_at: null,
    },
    payments: [{
      id: 'payment-id',
      amount_mmk: 200000n,
      status: 'VERIFIED',
      transaction_ref: 'TX-1',
      created_at: new Date('2026-07-31T00:00:00.000Z'),
      updated_at: new Date('2026-07-31T00:00:00.000Z'),
    }],
    deliverables: [{
      id: 'deliverable-id',
      file_name: 'work.webp',
      file_size_bytes: 128n,
      status: 'UNDER_REVIEW',
      submitted_at: new Date('2026-07-31T00:00:00.000Z'),
      approved_at: null,
    }],
  } satisfies Parameters<typeof mapOrderDetail>[0];

  const result = mapOrderDetail(record);
  assert.equal(result.job_post?.budget_max_mmk, '250000');
  assert.equal(result.deliverables[0]?.file_size_bytes, '128');
  assert.equal('file_url_clean' in result.deliverables[0]!, false);
  assert.doesNotThrow(() => JSON.stringify(result));
});
