import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import {
  chatAttachmentObjectPath,
  chatWatermarkOverlay,
  processChatAttachment,
} from '../src/features/workroom/chat-attachment.service.js';

test('Sharp creates a bounded watermarked WebP chat image', async () => {
  const input = await sharp({
    create: {
      width: 1600,
      height: 900,
      channels: 3,
      background: { r: 40, g: 80, b: 120 },
    },
  }).png().toBuffer();

  const output = await processChatAttachment({ buffer: input });
  const metadata = await sharp(output).metadata();

  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 675);
  assert.notDeepEqual(output, input);
  assert.match(chatWatermarkOverlay(1200, 675).toString('utf8'), /Gigmatch DRAFT/);
});

test('chat attachment paths are generated from trusted identifiers', () => {
  assert.equal(
    chatAttachmentObjectPath('order-id', 'message-id'),
    'chat-attachments/order-id/message-id.webp',
  );
});

test('invalid chat image bytes return a stable API error', async () => {
  await assert.rejects(
    () => processChatAttachment({ buffer: Buffer.from('not an image') }),
    (error: unknown) =>
      error instanceof Error &&
      'code' in error &&
      error.code === 'CHAT_ATTACHMENT_INVALID_IMAGE',
  );
});
