import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertWorkroomChatIsActive,
} from '../src/features/workroom/workroom.service.js';
import {
  mapWorkroomMessage,
  workroomRoomName,
} from '../src/features/workroom/workroom.types.js';

test('chat is locked for every order state except ACTIVE', () => {
  const lockedStates = [
    'AWAITING_ESCROW',
    'IN_REVIEW',
    'COMPLETED',
    'DISPUTED',
    'CANCELED',
  ];

  for (const state of lockedStates) {
    assert.throws(
      () => assertWorkroomChatIsActive(state),
      (error: unknown) =>
        error instanceof Error &&
        'code' in error &&
        error.code === 'CHAT_LOCKED' &&
        error.message === 'Chat is locked until escrow is verified.',
    );
  }

  assert.doesNotThrow(() => assertWorkroomChatIsActive('ACTIVE'));
});

test('workroom mapping converts dates and keeps nullable attachment fields safe', () => {
  const result = mapWorkroomMessage({
    id: 'message-id',
    order_id: 'order-id',
    sender_id: 'sender-id',
    type: 'TEXT',
    content: 'hello',
    attachment_url: null,
    attachment_type: null,
    audio_duration_seconds: null,
    created_at: new Date('2026-07-31T00:00:00.000Z'),
  });

  assert.deepEqual(result, {
    id: 'message-id',
    order_id: 'order-id',
    sender_id: 'sender-id',
    type: 'TEXT',
    content: 'hello',
    attachment_url: null,
    attachment_type: null,
    audio_duration_seconds: null,
    created_at: '2026-07-31T00:00:00.000Z',
  });
  assert.doesNotThrow(() => JSON.stringify(result));
});

test('room names are scoped to the canonical order namespace', () => {
  assert.equal(workroomRoomName('order-id'), 'order:order-id');
});
