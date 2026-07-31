import test from 'node:test';
import assert from 'node:assert/strict';
import {
  joinRoomSchema,
  sendMessageSchema,
  workroomHistoryQuerySchema,
} from 'shared/schemas';

const orderId = '00000000-0000-4000-8000-000000000001';

test('workroom event schemas reject unknown client controlled fields', () => {
  assert.equal(joinRoomSchema.safeParse({ order_id: orderId, user_id: orderId }).success, false);
  assert.equal(sendMessageSchema.safeParse({
    order_id: orderId,
    type: 'TEXT',
    content: 'hello',
    sender_id: orderId,
  }).success, false);
});

test('send message schema enforces text content boundaries', () => {
  assert.equal(sendMessageSchema.safeParse({
    order_id: orderId,
    type: 'TEXT',
    content: 'a',
  }).success, true);
  assert.equal(sendMessageSchema.safeParse({
    order_id: orderId,
    type: 'TEXT',
    content: 'a'.repeat(4000),
  }).success, true);
  assert.equal(sendMessageSchema.safeParse({
    order_id: orderId,
    type: 'TEXT',
    content: 'a'.repeat(4001),
  }).success, false);
  assert.equal(sendMessageSchema.safeParse({
    order_id: orderId,
    type: 'TEXT',
    content: '   ',
  }).success, false);
});

test('history query applies safe defaults and page size limit', () => {
  assert.deepEqual(workroomHistoryQuerySchema.parse({}), { page: 1, page_size: 50 });
  assert.deepEqual(workroomHistoryQuerySchema.parse({ page: '2', page_size: '20' }), {
    page: 2,
    page_size: 20,
  });
  assert.equal(workroomHistoryQuerySchema.safeParse({ page_size: '51' }).success, false);
  assert.equal(workroomHistoryQuerySchema.safeParse({ page: '0' }).success, false);
});
