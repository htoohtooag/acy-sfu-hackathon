import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { ApiError } from '../../utils/api-error.js';
import { createFileMessage, findParticipantOrder } from './workroom.repository.js';
import { assertWorkroomChatIsActive } from './workroom.rules.js';
import { publishWorkroomEvent } from './workroom.events.js';
import {
  mapWorkroomMessage,
  type WorkroomMessageRecord,
} from './workroom.types.js';
import type { WorkroomMessage } from 'shared/schemas';

const chatImageMaxWidth = 1200;
const chatImageQuality = 82;

export type ChatAttachmentFile = {
  buffer: Buffer;
};

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export function chatAttachmentObjectPath(orderId: string, messageId: string): string {
  return `chat-attachments/${orderId}/${messageId}.webp`;
}

export function chatWatermarkOverlay(width: number, height: number): Buffer {
  const tileWidth = Math.max(260, Math.round(width / 3));
  const tileHeight = Math.max(150, Math.round(height / 4));
  const fontSize = Math.max(24, Math.round(width / 24));
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="draft-watermark" width="${tileWidth}" height="${tileHeight}" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
      <text x="${Math.round(tileWidth / 2)}" y="${Math.round(tileHeight / 2)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="white" fill-opacity="0.42" stroke="black" stroke-opacity="0.18" stroke-width="2">TalentScout DRAFT</text>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#draft-watermark)" />
</svg>`;

  return Buffer.from(svg);
}

export async function processChatAttachment(file: ChatAttachmentFile): Promise<Buffer> {
  try {
    const inputMetadata = await sharp(file.buffer).metadata();
    if (inputMetadata.width === undefined || inputMetadata.height === undefined) {
      throw new ApiError(415, 'CHAT_ATTACHMENT_INVALID_IMAGE', 'The uploaded file is not a valid image.');
    }

    const resized = await sharp(file.buffer)
      .rotate()
      .resize({ width: chatImageMaxWidth, withoutEnlargement: true })
      .toBuffer();
    const outputMetadata = await sharp(resized).metadata();
    if (outputMetadata.width === undefined || outputMetadata.height === undefined) {
      throw new ApiError(415, 'CHAT_ATTACHMENT_INVALID_IMAGE', 'The uploaded file is not a valid image.');
    }

    return await sharp(resized)
      .composite([{ input: chatWatermarkOverlay(outputMetadata.width, outputMetadata.height) }])
      .webp({ quality: chatImageQuality })
      .toBuffer();
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(415, 'CHAT_ATTACHMENT_INVALID_IMAGE', 'The uploaded file could not be processed as an image.');
  }
}

async function uploadObject(path: string, body: Buffer): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(env.SUPABASE_CHAT_ATTACHMENT_BUCKET).upload(path, body, {
    contentType: 'image/webp',
    upsert: false,
  });

  if (error !== null) {
    throw new ApiError(502, 'CHAT_ATTACHMENT_STORAGE_FAILED', 'The chat image could not be stored.');
  }
}

async function signedUrl(path: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(env.SUPABASE_CHAT_ATTACHMENT_BUCKET)
    .createSignedUrl(path, env.CHAT_ATTACHMENT_SIGNED_URL_TTL_SECONDS);

  if (error !== null || data?.signedUrl === undefined) {
    throw new ApiError(502, 'CHAT_ATTACHMENT_STORAGE_FAILED', 'A chat image access URL could not be created.');
  }

  return data.signedUrl;
}

async function removeObject(path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(env.SUPABASE_CHAT_ATTACHMENT_BUCKET).remove([path]);
  if (error !== null) {
    console.error('Chat attachment storage cleanup failed.', { path });
  }
}

function isChatAttachmentPath(value: string): boolean {
  return value.startsWith('chat-attachments/');
}

async function mapWorkroomMessageWithSignedUrl(record: WorkroomMessageRecord): Promise<WorkroomMessage> {
  if (record.type !== 'FILE' || record.attachment_url === null || !isChatAttachmentPath(record.attachment_url)) {
    return mapWorkroomMessage(record);
  }

  return mapWorkroomMessage(record, await signedUrl(record.attachment_url));
}

export async function mapWorkroomMessagesWithSignedUrls(
  records: WorkroomMessageRecord[],
): Promise<WorkroomMessage[]> {
  return Promise.all(records.map(mapWorkroomMessageWithSignedUrl));
}

export async function uploadWorkroomImage(
  userId: string,
  orderId: string,
  file: ChatAttachmentFile,
): Promise<WorkroomMessage> {
  const order = await findParticipantOrder(orderId, userId);
  if (order === null) {
    throw new ApiError(404, 'ORDER_NOT_FOUND', 'The order was not found.');
  }
  assertWorkroomChatIsActive(order.status);

  const processedImage = await processChatAttachment(file);
  const messageId = randomUUID();
  const attachmentPath = chatAttachmentObjectPath(orderId, messageId);

  try {
    await uploadObject(attachmentPath, processedImage);
    const attachmentUrl = await signedUrl(attachmentPath);
    const message = await prisma.$transaction(async (transaction) => {
      const currentOrder = await findParticipantOrder(orderId, userId, transaction);
      if (currentOrder === null) {
        throw new ApiError(404, 'ORDER_NOT_FOUND', 'The order was not found.');
      }
      assertWorkroomChatIsActive(currentOrder.status);

      return createFileMessage(messageId, orderId, userId, attachmentPath, transaction);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    const responseMessage = mapWorkroomMessage(message, attachmentUrl);
    publishWorkroomEvent({ type: 'message', order_id: orderId, message: responseMessage });
    return responseMessage;
  } catch (error: unknown) {
    await removeObject(attachmentPath);

    if (error instanceof ApiError) {
      throw error;
    }

    if (isPrismaError(error, 'P2034')) {
      throw new ApiError(409, 'CHAT_RETRY_REQUIRED', 'The chat changed while uploading. Please retry.');
    }

    throw error;
  }
}
