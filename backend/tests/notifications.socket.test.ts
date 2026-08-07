import assert from 'node:assert/strict';
import test from 'node:test';
import {
  configureNotificationEmitter,
  emitNotification,
  userRoomName,
} from '../src/features/notifications/notification.socket.js';

test('private notification rooms use the verified user id', () => {
  assert.equal(userRoomName('user-id'), 'user:user-id');
});

test('notification socket boundary forwards the safe payload to the recipient', () => {
  const received: { userId: string; title: string }[] = [];
  configureNotificationEmitter((userId, payload) => {
    received.push({ userId, title: payload.title });
  });

  emitNotification('user-id', {
    id: '00000000-0000-4000-8000-000000000001',
    category: 'ORDERS_ESCROW',
    title: 'Order Active',
    body: 'The order is active.',
    is_read: false,
    metadata: { link: '/messages/order-id' },
    created_at: '2026-08-08T00:00:00.000Z',
  });

  assert.deepEqual(received, [{ userId: 'user-id', title: 'Order Active' }]);
});
