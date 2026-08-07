import test from 'node:test';
import assert from 'node:assert/strict';
import {
  packageTierLookupListSchema,
  packageTierLookupSchema,
  paymentMethodLookupListSchema,
  paymentMethodLookupSchema,
} from 'shared/schemas';

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

test('payment method lookup schema accepts nullable configured account metadata', () => {
  const result = paymentMethodLookupListSchema.safeParse([
    {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'KBZ_PAY',
      display_name: 'KBZPay',
      logo_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d',
      account_name: 'TalentScout',
      account_number: '09 123 456 789',
      instructions: 'Include your order id in the transfer note.',
    },
    {
      id: '00000000-0000-4000-8000-000000000002',
      name: 'WAVE_MONEY',
      display_name: 'Wave Money',
      logo_url: null,
      account_name: null,
      account_number: null,
      instructions: null,
    },
  ]);

  assert.equal(result.success, true);
});

test('payment method lookup schema rejects malformed ids and unknown fields', () => {
  assert.equal(paymentMethodLookupSchema.safeParse({
    id: 'not-a-uuid',
    name: 'KBZ_PAY',
    display_name: 'KBZPay',
    logo_url: null,
    account_name: null,
    account_number: null,
    instructions: null,
  }).success, false);
  assert.equal(paymentMethodLookupSchema.safeParse({
    id: '00000000-0000-4000-8000-000000000001',
    name: 'KBZ_PAY',
    display_name: 'KBZPay',
    logo_url: null,
    account_name: null,
    account_number: null,
    instructions: null,
    is_active: true,
  }).success, false);
  assert.equal(paymentMethodLookupSchema.safeParse({
    id: '00000000-0000-4000-8000-000000000001',
    name: 'KBZ_PAY',
    display_name: 'KBZPay',
    logo_url: 'not-a-url',
    account_name: null,
    account_number: null,
    instructions: null,
  }).success, false);
});
