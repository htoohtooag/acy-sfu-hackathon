import assert from 'node:assert/strict';
import test from 'node:test';
import { mapNotification } from '../src/features/notifications/notification.types.js';
import type { NotificationRecord } from '../src/features/notifications/notification.types.js';

const baseRecord: NotificationRecord = {
  id: '00000000-0000-4000-8000-000000000001',
  user_id: '00000000-0000-4000-8000-000000000002',
  category: 'ORDERS_ESCROW',
  title: 'Escrow verified',
  body: 'Your order is active.',
  is_read: false,
  metadata: { link: '/messages/order-id' },
  created_at: new Date('2026-08-08T00:00:00.000Z'),
};

test('notification mapper returns the safe API shape and hides user ownership', () => {
  const result = mapNotification(baseRecord);

  assert.deepEqual(result, {
    id: '00000000-0000-4000-8000-000000000001',
    category: 'ORDERS_ESCROW',
    title: 'Escrow verified',
    body: 'Your order is active.',
    is_read: false,
    metadata: { link: '/messages/order-id' },
    created_at: '2026-08-08T00:00:00.000Z',
  });
  assert.equal('user_id' in result, false);
  assert.doesNotThrow(() => JSON.stringify(result));
});

test('notification mapper falls back to an empty object for nonobject legacy metadata', () => {
  const result = mapNotification({
    ...baseRecord,
    metadata: ['legacy-value'],
  });

  assert.deepEqual(result.metadata, {});
});
