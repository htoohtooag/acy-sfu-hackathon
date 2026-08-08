import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deliverableDecisionParamsSchema,
  deliverableDecisionSchema,
  deliverableDownloadResponseSchema,
  deliverableOrderParamsSchema,
  deliverablePreviewResponseSchema,
} from 'shared/schemas';

const orderId = '00000000-0000-4000-8000-000000000001';
const deliverableId = '00000000-0000-4000-8000-000000000002';

test('deliverable routes accept only UUID parameters', () => {
  assert.deepEqual(deliverableOrderParamsSchema.parse({ id: orderId }), { id: orderId });
  assert.deepEqual(deliverableDecisionParamsSchema.parse({ id: orderId, deliverableId }), {
    id: orderId,
    deliverableId,
  });
  assert.equal(deliverableOrderParamsSchema.safeParse({ id: 'not-a-uuid' }).success, false);
  assert.equal(deliverableDecisionParamsSchema.safeParse({ id: orderId, deliverableId: 'bad' }).success, false);
});

test('deliverable decisions reject client controlled state and URLs', () => {
  assert.deepEqual(deliverableDecisionSchema.parse({ action: 'APPROVE' }), { action: 'APPROVE' });
  assert.deepEqual(deliverableDecisionSchema.parse({ action: 'REJECT' }), { action: 'REJECT' });
  assert.equal(deliverableDecisionSchema.safeParse({ action: 'APPROVED' }).success, false);
  assert.equal(deliverableDecisionSchema.safeParse({ action: 'APPROVE', status: 'COMPLETED' }).success, false);
  assert.equal(deliverableDecisionSchema.safeParse({ action: 'APPROVE', clean_url: 'https://example.com' }).success, false);
});

test('watermarked preview responses require a fresh signed URL', () => {
  assert.deepEqual(deliverablePreviewResponseSchema.parse({
    deliverable_id: deliverableId,
    watermarked_url: 'https://example.com/storage/sign/watermarked.webp?token=temporary',
  }), {
    deliverable_id: deliverableId,
    watermarked_url: 'https://example.com/storage/sign/watermarked.webp?token=temporary',
  });
  assert.equal(deliverablePreviewResponseSchema.safeParse({
    deliverable_id: deliverableId,
  }).success, false);
});

test('completed download responses include the original filename and a fresh signed URL', () => {
  assert.deepEqual(deliverableDownloadResponseSchema.parse({
    deliverable_id: deliverableId,
    file_name: 'final-design.png',
    clean_url: 'https://example.com/storage/sign/clean.webp?download=final-design.png',
  }), {
    deliverable_id: deliverableId,
    file_name: 'final-design.png',
    clean_url: 'https://example.com/storage/sign/clean.webp?download=final-design.png',
  });
  assert.equal(deliverableDownloadResponseSchema.safeParse({
    deliverable_id: deliverableId,
    file_name: 'final-design.png',
  }).success, false);
});
