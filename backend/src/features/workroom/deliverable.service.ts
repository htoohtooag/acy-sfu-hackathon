import { randomUUID } from 'node:crypto';
import type {
  DeliverableDecisionRequest,
  DeliverableDecisionResponse,
  DeliverableSubmissionResponse,
} from 'shared/schemas';
import sharp from 'sharp';
import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { ApiError } from '../../utils/api-error.js';
import {
  createDeliverable,
  createSystemMessage,
  findDeliverable,
  findDeliveryOrder,
  incrementFreelancerCompletionStats,
  markDeliverableApproved,
  markDeliverableRejected,
  markOrderActive,
  markOrderCompleted,
  markOrderInReview,
} from './deliverable.repository.js';
import type { DeliverableRecord, DeliveryOrderRecord } from './deliverable.types.js';
import { publishWorkroomEvent } from './workroom.events.js';
import { mapWorkroomMessage } from './workroom.types.js';

const previewWidth = 1200;
const submissionMessage = 'Freelancer submitted final work.';
const revisionMessage = 'Client requested a revision.';
const approvalMessage = 'Client approved final work.';

export type DeliverableFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

type ProcessedAssets = {
  clean: Buffer;
  watermarked: Buffer;
};

type StoredDeliverableResult = {
  deliverable: DeliverableRecord;
  message: ReturnType<typeof mapWorkroomMessage>;
};

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

function assertFreelancer(order: DeliveryOrderRecord, userId: string): void {
  if (order.freelancer_id !== userId) {
    throw new ApiError(403, 'DELIVERABLE_ACCESS_DENIED', 'Only the order freelancer can submit a deliverable.');
  }
}

function assertClient(order: DeliveryOrderRecord, userId: string): void {
  if (order.client_id !== userId) {
    throw new ApiError(403, 'DELIVERABLE_ACCESS_DENIED', 'Only the order client can decide a deliverable.');
  }
}

function assertOrderStatus(
  order: DeliveryOrderRecord,
  status: 'ACTIVE' | 'IN_REVIEW',
): void {
  if (order.status !== status) {
    throw new ApiError(
      409,
      status === 'ACTIVE' ? 'ORDER_NOT_ACTIVE' : 'DELIVERABLE_NOT_REVIEWABLE',
      status === 'ACTIVE'
        ? 'A deliverable can only be submitted for an active order.'
        : 'The deliverable is not waiting for a client decision.',
    );
  }
}

function assertUnderReview(deliverable: DeliverableRecord): void {
  if (deliverable.status !== 'UNDER_REVIEW') {
    throw new ApiError(409, 'DELIVERABLE_NOT_REVIEWABLE', 'The deliverable is not waiting for a client decision.');
  }
}

function safeFileName(originalName: string): string {
  const baseName = originalName.replaceAll('\\', '/').split('/').at(-1) ?? 'deliverable';
  const cleaned = baseName
    .replace(/[\u0000-\u001f\u007f]/gu, '_')
    .replace(/[^\p{L}\p{N}._ -]/gu, '_')
    .trim();

  return (cleaned.length > 0 ? cleaned : 'deliverable').slice(0, 255);
}

function objectPath(orderId: string, deliverableId: string, variant: 'clean' | 'watermarked'): string {
  return `deliverables/${orderId}/${deliverableId}/${variant}.webp`;
}

function watermarkOverlay(width: number): Buffer {
  const height = Math.max(120, Math.round(width * 0.18));
  const fontSize = Math.max(28, Math.round(width / 14));
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <text x="50%" y="58%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="white" fill-opacity="0.62" stroke="black" stroke-opacity="0.32" stroke-width="2">DRAFT - UNPAID</text>
</svg>`;

  return Buffer.from(svg);
}

export async function processAssets(file: DeliverableFile): Promise<ProcessedAssets> {
  try {
    const metadata = await sharp(file.buffer).metadata();
    if (metadata.width === undefined || metadata.height === undefined) {
      throw new ApiError(415, 'DELIVERABLE_INVALID_IMAGE', 'The uploaded file is not a valid image.');
    }

    const clean = await sharp(file.buffer)
      .rotate()
      .webp({ quality: 92 })
      .toBuffer();

    const width = Math.min(metadata.width, previewWidth);
    const watermarked = await sharp(file.buffer)
      .rotate()
      .resize({ width: previewWidth, withoutEnlargement: true })
      .composite([{ input: watermarkOverlay(width), gravity: 'center' }])
      .webp({ quality: 82 })
      .toBuffer();

    return { clean, watermarked };
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(415, 'DELIVERABLE_INVALID_IMAGE', 'The uploaded file could not be processed as an image.');
  }
}

async function uploadObject(path: string, body: Buffer): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(env.SUPABASE_DELIVERABLE_BUCKET).upload(path, body, {
    contentType: 'image/webp',
    upsert: false,
  });

  if (error !== null) {
    throw new ApiError(502, 'DELIVERABLE_STORAGE_FAILED', 'The deliverable could not be stored.');
  }
}

async function signedUrl(path: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(env.SUPABASE_DELIVERABLE_BUCKET)
    .createSignedUrl(path, env.DELIVERABLE_SIGNED_URL_TTL_SECONDS);

  if (error !== null || data?.signedUrl === undefined) {
    throw new ApiError(502, 'DELIVERABLE_STORAGE_FAILED', 'A deliverable access URL could not be created.');
  }

  return data.signedUrl;
}

async function removeObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) {
    return;
  }

  const { error } = await supabaseAdmin.storage.from(env.SUPABASE_DELIVERABLE_BUCKET).remove(paths);
  if (error !== null) {
    console.error('Deliverable storage cleanup failed.', { count: paths.length });
  }
}

function submissionResponse(
  deliverable: DeliverableRecord,
  watermarkedUrl: string,
): DeliverableSubmissionResponse {
  if (deliverable.status !== 'UNDER_REVIEW') {
    throw new ApiError(500, 'DELIVERABLE_SUBMISSION_FAILED', 'The submitted deliverable state is invalid.');
  }

  return {
    deliverable_id: deliverable.id,
    order_id: deliverable.order_id,
    file_name: deliverable.file_name,
    file_size_bytes: deliverable.file_size_bytes?.toString() ?? '0',
    deliverable_status: 'UNDER_REVIEW',
    order_status: 'IN_REVIEW',
    submitted_at: deliverable.submitted_at.toISOString(),
    watermarked_url: watermarkedUrl,
  };
}

function approvalResponse(
  deliverable: DeliverableRecord,
  cleanUrl: string,
): DeliverableDecisionResponse {
  if (deliverable.status !== 'APPROVED' || deliverable.approved_at === null) {
    throw new ApiError(500, 'DELIVERABLE_APPROVAL_FAILED', 'The approved deliverable state is invalid.');
  }

  return {
    deliverable_id: deliverable.id,
    order_id: deliverable.order_id,
    deliverable_status: 'APPROVED',
    order_status: 'COMPLETED',
    approved_at: deliverable.approved_at.toISOString(),
    clean_url: cleanUrl,
  };
}

function rejectionResponse(deliverable: DeliverableRecord): DeliverableDecisionResponse {
  if (deliverable.status !== 'REJECTED') {
    throw new ApiError(500, 'DELIVERABLE_REJECTION_FAILED', 'The rejected deliverable state is invalid.');
  }

  return {
    deliverable_id: deliverable.id,
    order_id: deliverable.order_id,
    deliverable_status: 'REJECTED',
    order_status: 'ACTIVE',
  };
}

export async function submitDeliverable(
  freelancerUserId: string,
  orderId: string,
  file: DeliverableFile,
): Promise<DeliverableSubmissionResponse> {
  const order = await findDeliveryOrder(orderId);
  if (order === null) {
    throw new ApiError(404, 'ORDER_NOT_FOUND', 'The order was not found.');
  }

  assertFreelancer(order, freelancerUserId);
  assertOrderStatus(order, 'ACTIVE');

  const assets = await processAssets(file);
  const deliverableId = randomUUID();
  const cleanPath = objectPath(orderId, deliverableId, 'clean');
  const watermarkedPath = objectPath(orderId, deliverableId, 'watermarked');
  const uploadedPaths: string[] = [];

  try {
    await uploadObject(cleanPath, assets.clean);
    uploadedPaths.push(cleanPath);
    await uploadObject(watermarkedPath, assets.watermarked);
    uploadedPaths.push(watermarkedPath);
    const watermarkedUrl = await signedUrl(watermarkedPath);

    const stored = await prisma.$transaction(async (transaction): Promise<StoredDeliverableResult> => {
      const currentOrder = await findDeliveryOrder(orderId, transaction);
      if (currentOrder === null) {
        throw new ApiError(404, 'ORDER_NOT_FOUND', 'The order was not found.');
      }

      assertFreelancer(currentOrder, freelancerUserId);
      assertOrderStatus(currentOrder, 'ACTIVE');

      const deliverable = await createDeliverable({
        id: deliverableId,
        order_id: orderId,
        file_name: safeFileName(file.originalname),
        file_url_clean: cleanPath,
        file_url_watermarked: watermarkedPath,
        file_size_bytes: BigInt(assets.clean.byteLength),
      }, transaction);

      if (!await markOrderInReview(orderId, transaction)) {
        throw new ApiError(409, 'ORDER_NOT_ACTIVE', 'A deliverable can only be submitted for an active order.');
      }

      const message = await createSystemMessage(orderId, freelancerUserId, submissionMessage, transaction);
      return { deliverable, message: mapWorkroomMessage(message) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    publishWorkroomEvent({ type: 'message', order_id: orderId, message: stored.message });
    publishWorkroomEvent({
      type: 'deliverable_submitted',
      order_id: orderId,
      data: {
        deliverable_id: stored.deliverable.id,
        order_id: orderId,
        watermarked_url: watermarkedUrl,
      },
    });

    return submissionResponse(stored.deliverable, watermarkedUrl);
  } catch (error: unknown) {
    await removeObjects(uploadedPaths);

    if (error instanceof ApiError) {
      throw error;
    }

    if (isPrismaError(error, 'P2034')) {
      throw new ApiError(409, 'DELIVERABLE_RETRY_REQUIRED', 'The order changed while submitting the deliverable. Please retry.');
    }

    throw error;
  }
}

export async function approveOrRejectDeliverable(
  clientUserId: string,
  orderId: string,
  deliverableId: string,
  decision: DeliverableDecisionRequest,
): Promise<DeliverableDecisionResponse> {
  const order = await findDeliveryOrder(orderId);
  if (order === null) {
    throw new ApiError(404, 'ORDER_NOT_FOUND', 'The order was not found.');
  }

  assertClient(order, clientUserId);
  assertOrderStatus(order, 'IN_REVIEW');

  const deliverable = await findDeliverable(orderId, deliverableId);
  if (deliverable === null) {
    throw new ApiError(404, 'DELIVERABLE_NOT_FOUND', 'The deliverable was not found.');
  }

  assertUnderReview(deliverable);

  if (decision.action === 'APPROVE') {
    const cleanUrl = await signedUrl(deliverable.file_url_clean);

    try {
      const result = await prisma.$transaction(async (transaction) => {
        const currentOrder = await findDeliveryOrder(orderId, transaction);
        const currentDeliverable = await findDeliverable(orderId, deliverableId, transaction);
        if (currentOrder === null) {
          throw new ApiError(404, 'ORDER_NOT_FOUND', 'The order was not found.');
        }

        assertClient(currentOrder, clientUserId);
        assertOrderStatus(currentOrder, 'IN_REVIEW');
        if (currentDeliverable === null) {
          throw new ApiError(404, 'DELIVERABLE_NOT_FOUND', 'The deliverable was not found.');
        }

        assertUnderReview(currentDeliverable);
        const approvedAt = new Date();
        if (!await markDeliverableApproved(orderId, deliverableId, approvedAt, transaction)) {
          throw new ApiError(409, 'DELIVERABLE_NOT_REVIEWABLE', 'The deliverable is not waiting for a client decision.');
        }

        if (!await markOrderCompleted(orderId, transaction)) {
          throw new ApiError(409, 'DELIVERABLE_NOT_REVIEWABLE', 'The order is not waiting for a client decision.');
        }

        if (!await incrementFreelancerCompletionStats(
          currentOrder.freelancer_id,
          currentOrder.agreed_price_mmk,
          transaction,
        )) {
          throw new ApiError(500, 'FREELANCER_PROFILE_NOT_FOUND', 'The freelancer profile could not be updated.');
        }

        const updatedDeliverable = await findDeliverable(orderId, deliverableId, transaction);
        if (updatedDeliverable === null) {
          throw new ApiError(500, 'DELIVERABLE_APPROVAL_FAILED', 'The approved deliverable could not be reloaded.');
        }

        const message = await createSystemMessage(orderId, clientUserId, approvalMessage, transaction);
        return { deliverable: updatedDeliverable, message: mapWorkroomMessage(message) };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      publishWorkroomEvent({ type: 'message', order_id: orderId, message: result.message });
      publishWorkroomEvent({
        type: 'deliverable_unlocked',
        order_id: orderId,
        data: {
          deliverable_id: deliverableId,
          order_id: orderId,
          clean_url: cleanUrl,
        },
      });

      return approvalResponse(result.deliverable, cleanUrl);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (isPrismaError(error, 'P2034')) {
        throw new ApiError(409, 'DELIVERABLE_RETRY_REQUIRED', 'The order changed while approving the deliverable. Please retry.');
      }

      throw error;
    }
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const currentOrder = await findDeliveryOrder(orderId, transaction);
      const currentDeliverable = await findDeliverable(orderId, deliverableId, transaction);
      if (currentOrder === null) {
        throw new ApiError(404, 'ORDER_NOT_FOUND', 'The order was not found.');
      }

      assertClient(currentOrder, clientUserId);
      assertOrderStatus(currentOrder, 'IN_REVIEW');
      if (currentDeliverable === null) {
        throw new ApiError(404, 'DELIVERABLE_NOT_FOUND', 'The deliverable was not found.');
      }

      assertUnderReview(currentDeliverable);
      if (!await markDeliverableRejected(orderId, deliverableId, transaction)) {
        throw new ApiError(409, 'DELIVERABLE_NOT_REVIEWABLE', 'The deliverable is not waiting for a client decision.');
      }

      if (!await markOrderActive(orderId, transaction)) {
        throw new ApiError(409, 'DELIVERABLE_NOT_REVIEWABLE', 'The order is not waiting for a client decision.');
      }

      const updatedDeliverable = await findDeliverable(orderId, deliverableId, transaction);
      if (updatedDeliverable === null) {
        throw new ApiError(500, 'DELIVERABLE_REJECTION_FAILED', 'The rejected deliverable could not be reloaded.');
      }

      const message = await createSystemMessage(orderId, clientUserId, revisionMessage, transaction);
      return { deliverable: updatedDeliverable, message: mapWorkroomMessage(message) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    publishWorkroomEvent({ type: 'message', order_id: orderId, message: result.message });
    return rejectionResponse(result.deliverable);
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (isPrismaError(error, 'P2034')) {
      throw new ApiError(409, 'DELIVERABLE_RETRY_REQUIRED', 'The order changed while rejecting the deliverable. Please retry.');
    }

    throw error;
  }
}

export {
  approvalResponse,
  objectPath,
  rejectionResponse,
  safeFileName,
  submissionResponse,
  watermarkOverlay,
};
