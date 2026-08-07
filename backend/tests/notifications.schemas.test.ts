import assert from 'node:assert/strict';
import test from 'node:test';
import {
  notificationListQuerySchema,
  notificationMarkAllReadSchema,
  notificationMetadataWithLinkSchema,
  notificationResponseSchema,
} from 'shared/schemas';

const notificationId = '00000000-0000-4000-8000-000000000001';

test('notification list query applies safe defaults', () => {
  assert.deepEqual(notificationListQuerySchema.parse({}), {
    unreadOnly: false,
    page: 1,
    page_size: 20,
  });
});

test('notification list query accepts category, boolean, and pagination filters', () => {
  assert.deepEqual(notificationListQuerySchema.parse({
    category: 'ORDERS_ESCROW',
    unreadOnly: 'true',
    page: '2',
    page_size: '50',
  }), {
    category: 'ORDERS_ESCROW',
    unreadOnly: true,
    page: 2,
    page_size: 50,
  });
});

test('notification list query rejects unknown and malformed values', () => {
  assert.equal(notificationListQuerySchema.safeParse({ category: 'ORDER' }).success, false);
  assert.equal(notificationListQuerySchema.safeParse({ unreadOnly: 'yes' }).success, false);
  assert.equal(notificationListQuerySchema.safeParse({ page_size: '51' }).success, false);
  assert.equal(notificationListQuerySchema.safeParse({ unexpected: true }).success, false);
});

test('mark all read accepts an empty body and rejects client controlled fields', () => {
  assert.deepEqual(notificationMarkAllReadSchema.parse(undefined), {});
  assert.deepEqual(notificationMarkAllReadSchema.parse({}), {});
  assert.equal(notificationMarkAllReadSchema.safeParse({ is_read: true }).success, false);
});

test('notification response accepts safe JSON data and ISO timestamps', () => {
  const result = notificationResponseSchema.safeParse({
    id: notificationId,
    category: 'SYSTEM_ACCOUNT',
    title: 'Welcome',
    body: null,
    is_read: false,
    metadata: { link: '/notifications' },
    created_at: '2026-08-08T00:00:00.000Z',
  });

  assert.equal(result.success, true);
});

test('notification creation metadata requires an internal link', () => {
  assert.deepEqual(notificationMetadataWithLinkSchema.parse({
    link: '  /messages/order-id  ',
    order_id: 'order-id',
  }), {
    link: '/messages/order-id',
    order_id: 'order-id',
  });
  assert.equal(notificationMetadataWithLinkSchema.safeParse({ link: '' }).success, false);
  assert.equal(notificationMetadataWithLinkSchema.safeParse({ link: 'https://example.com' }).success, false);
});
