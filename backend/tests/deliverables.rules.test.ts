import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import {
  approvalResponse,
  objectPath,
  processAssets,
  rejectionResponse,
  safeFileName,
  submissionResponse,
  watermarkOverlay,
} from '../src/features/workroom/deliverable.service.js';
import { publishWorkroomEvent, subscribeWorkroomEvents } from '../src/features/workroom/workroom.events.js';

const baseDeliverable = {
  id: 'deliverable-id',
  order_id: 'order-id',
  file_name: 'design.png',
  file_url_clean: 'deliverables/order-id/deliverable-id/clean.webp',
  file_url_watermarked: 'deliverables/order-id/deliverable-id/watermarked.webp',
  file_size_bytes: 1234n,
  status: 'UNDER_REVIEW' as const,
  submitted_at: new Date('2026-07-31T00:00:00.000Z'),
  approved_at: null,
};

test('Sharp creates clean and bounded watermarked WebP assets', async () => {
  const input = await sharp({
    create: {
      width: 1400,
      height: 800,
      channels: 3,
      background: { r: 40, g: 80, b: 120 },
    },
  }).png().toBuffer();

  const assets = await processAssets({
    buffer: input,
    mimetype: 'image/png',
    originalname: 'original.png',
  });
  const cleanMetadata = await sharp(assets.clean).metadata();
  const watermarkedMetadata = await sharp(assets.watermarked).metadata();

  assert.equal(cleanMetadata.format, 'webp');
  assert.equal(cleanMetadata.width, 1400);
  assert.equal(watermarkedMetadata.format, 'webp');
  assert.equal(watermarkedMetadata.width, 1200);
  assert.notDeepEqual(assets.clean, assets.watermarked);
  assert.match(watermarkOverlay(1200).toString('utf8'), /DRAFT - UNPAID/);
});

test('storage paths are server owned and file names are sanitized', () => {
  assert.equal(objectPath('order-id', 'deliverable-id', 'clean'), 'deliverables/order-id/deliverable-id/clean.webp');
  assert.equal(objectPath('order-id', 'deliverable-id', 'watermarked'), 'deliverables/order-id/deliverable-id/watermarked.webp');
  assert.equal(safeFileName('../private/secret\u0000.png'), 'secret_.png');
  assert.equal(safeFileName(''), 'deliverable');
});

test('submission response exposes only the watermarked URL and serializes values', () => {
  const response = submissionResponse(baseDeliverable, 'https://storage.example/preview');

  assert.equal(response.watermarked_url, 'https://storage.example/preview');
  assert.equal('clean_url' in response, false);
  assert.equal('file_url_clean' in response, false);
  assert.equal(response.file_size_bytes, '1234');
  assert.doesNotThrow(() => JSON.stringify(response));
});

test('approval and rejection responses encode their exact state transitions', () => {
  const approved = approvalResponse({
    ...baseDeliverable,
    status: 'APPROVED',
    approved_at: new Date('2026-07-31T01:00:00.000Z'),
  }, 'https://storage.example/clean');
  const rejected = rejectionResponse({ ...baseDeliverable, status: 'REJECTED' });

  assert.deepEqual(approved, {
    deliverable_id: 'deliverable-id',
    order_id: 'order-id',
    deliverable_status: 'APPROVED',
    order_status: 'COMPLETED',
    approved_at: '2026-07-31T01:00:00.000Z',
    clean_url: 'https://storage.example/clean',
  });
  assert.deepEqual(rejected, {
    deliverable_id: 'deliverable-id',
    order_id: 'order-id',
    deliverable_status: 'REJECTED',
    order_status: 'ACTIVE',
  });
});

test('workroom delivery events are typed and published after state changes', () => {
  const received: string[] = [];
  const unsubscribe = subscribeWorkroomEvents((event) => {
    received.push(event.type);
    if (event.type === 'deliverable_submitted') {
      assert.equal('clean_url' in event.data, false);
      assert.equal(event.data.watermarked_url, 'https://storage.example/preview');
    }
  });

  publishWorkroomEvent({
    type: 'deliverable_submitted',
    order_id: 'order-id',
    data: {
      deliverable_id: 'deliverable-id',
      order_id: 'order-id',
      watermarked_url: 'https://storage.example/preview',
    },
  });
  publishWorkroomEvent({
    type: 'deliverable_unlocked',
    order_id: 'order-id',
    data: {
      deliverable_id: 'deliverable-id',
      order_id: 'order-id',
      clean_url: 'https://storage.example/clean',
    },
  });
  unsubscribe();

  assert.deepEqual(received, ['deliverable_submitted', 'deliverable_unlocked']);
});
