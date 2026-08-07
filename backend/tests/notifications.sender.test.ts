import assert from 'node:assert/strict';
import test from 'node:test';
import { createNotificationSender } from '../src/features/notifications/notification.service.js';
import type { NotificationRecord } from '../src/features/notifications/notification.types.js';

const baseRecord: NotificationRecord = {
  id: '00000000-0000-4000-8000-000000000001',
  user_id: '00000000-0000-4000-8000-000000000002',
  category: 'ORDERS_ESCROW',
  title: 'Escrow Verified',
  body: 'Your order is active.',
  is_read: false,
  metadata: { link: '/messages/order-id' },
  created_at: new Date('2026-08-08T00:00:00.000Z'),
};

test('notification sender persists before emitting the safe payload', async () => {
  const steps: string[] = [];
  let emittedUserId = '';

  const sender = createNotificationSender({
    create: async (input) => {
      steps.push('persist');
      return {
        ...baseRecord,
        user_id: input.userId,
        category: input.category,
        title: input.title,
        body: input.body,
        metadata: input.metadata,
      };
    },
    emit: (userId, payload) => {
      steps.push('emit');
      emittedUserId = userId;
      assert.equal(payload.id, baseRecord.id);
      assert.equal('user_id' in payload, false);
    },
  });

  const result = await sender(
    baseRecord.user_id,
    'ORDERS_ESCROW',
    'Escrow Verified',
    'Your order is active.',
    { link: '/messages/order-id' },
  );

  assert.deepEqual(steps, ['persist', 'emit']);
  assert.equal(emittedUserId, baseRecord.user_id);
  assert.equal(result.metadata.link, '/messages/order-id');
});

test('notification sender does not emit when persistence fails', async () => {
  let emitted = false;
  const sender = createNotificationSender({
    create: async () => {
      throw new Error('database unavailable');
    },
    emit: () => {
      emitted = true;
    },
  });

  await assert.rejects(
    sender(
      baseRecord.user_id,
      'ORDERS_ESCROW',
      'Escrow Verified',
      null,
      { link: '/messages/order-id' },
    ),
    /database unavailable/,
  );
  assert.equal(emitted, false);
});

test('notification sender keeps the persisted result when socket emission fails', async () => {
  let persisted = false;
  const sender = createNotificationSender({
    create: async (input) => {
      persisted = true;
      return {
        ...baseRecord,
        user_id: input.userId,
        category: input.category,
        title: input.title,
        body: input.body,
        metadata: input.metadata,
      };
    },
    emit: () => {
      throw new Error('socket unavailable');
    },
  });

  const result = await sender(
    baseRecord.user_id,
    'ORDERS_ESCROW',
    'Escrow Verified',
    null,
    { link: '/messages/order-id' },
  );

  assert.equal(persisted, true);
  assert.equal(result.id, baseRecord.id);
  assert.equal(result.is_read, false);
});
