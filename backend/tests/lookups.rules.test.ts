import test from 'node:test';
import assert from 'node:assert/strict';

import { mergePaymentMethodDetails } from '../src/features/lookups/lookup.service.js';

test('payment method mapping preserves database account details', () => {
  const result = mergePaymentMethodDetails({
    id: 'payment-method-id',
    name: 'KBZ_PAY',
    display_name: 'KBZPay',
    logo_url: null,
    account_name: 'TEST KBZ',
    account_number: 'KBZ123',
    instructions: 'Use the order id.',
  });

  assert.equal(result.account_name, 'TEST KBZ');
  assert.equal(result.account_number, 'KBZ123');
  assert.equal(result.instructions, 'Use the order id.');
});
