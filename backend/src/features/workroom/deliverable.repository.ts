import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { createSystemMessage } from './workroom.repository.js';
import {
  deliverableSelect,
  deliveryOrderSelect,
} from './deliverable.types.js';
import type {
  DeliverableDatabaseClient,
  DeliverableRecord,
  DeliveryOrderRecord,
} from './deliverable.types.js';

export type DeliverableTransactionClient = Prisma.TransactionClient;

export async function findDeliveryOrder(
  orderId: string,
  client: DeliverableDatabaseClient = prisma,
): Promise<DeliveryOrderRecord | null> {
  return client.order.findFirst({
    where: { id: orderId, deleted_at: null },
    select: deliveryOrderSelect,
  });
}

export async function findDeliverable(
  orderId: string,
  deliverableId: string,
  client: DeliverableDatabaseClient = prisma,
): Promise<DeliverableRecord | null> {
  return client.deliverable.findFirst({
    where: { id: deliverableId, order_id: orderId },
    select: deliverableSelect,
  });
}

export async function createDeliverable(
  input: {
    id: string;
    order_id: string;
    file_name: string;
    file_url_clean: string;
    file_url_watermarked: string;
    file_size_bytes: bigint;
  },
  client: DeliverableTransactionClient,
): Promise<DeliverableRecord> {
  return client.deliverable.create({
    data: {
      id: input.id,
      order_id: input.order_id,
      file_name: input.file_name,
      file_url_clean: input.file_url_clean,
      file_url_watermarked: input.file_url_watermarked,
      file_size_bytes: input.file_size_bytes,
      status: 'UNDER_REVIEW',
    },
    select: deliverableSelect,
  });
}

export async function markOrderInReview(
  orderId: string,
  client: DeliverableTransactionClient,
): Promise<boolean> {
  const result = await client.order.updateMany({
    where: {
      id: orderId,
      deleted_at: null,
      status: 'ACTIVE',
    },
    data: { status: 'IN_REVIEW' },
  });

  return result.count === 1;
}

export async function markDeliverableApproved(
  orderId: string,
  deliverableId: string,
  approvedAt: Date,
  client: DeliverableTransactionClient,
): Promise<boolean> {
  const result = await client.deliverable.updateMany({
    where: {
      id: deliverableId,
      order_id: orderId,
      status: 'UNDER_REVIEW',
    },
    data: {
      status: 'APPROVED',
      approved_at: approvedAt,
    },
  });

  return result.count === 1;
}

export async function markDeliverableRejected(
  orderId: string,
  deliverableId: string,
  client: DeliverableTransactionClient,
): Promise<boolean> {
  const result = await client.deliverable.updateMany({
    where: {
      id: deliverableId,
      order_id: orderId,
      status: 'UNDER_REVIEW',
    },
    data: {
      status: 'REJECTED',
    },
  });

  return result.count === 1;
}

export async function markOrderCompleted(
  orderId: string,
  client: DeliverableTransactionClient,
): Promise<boolean> {
  const result = await client.order.updateMany({
    where: {
      id: orderId,
      deleted_at: null,
      status: 'IN_REVIEW',
    },
    data: { status: 'COMPLETED' },
  });

  return result.count === 1;
}

export async function markOrderActive(
  orderId: string,
  client: DeliverableTransactionClient,
): Promise<boolean> {
  const result = await client.order.updateMany({
    where: {
      id: orderId,
      deleted_at: null,
      status: 'IN_REVIEW',
    },
    data: { status: 'ACTIVE' },
  });

  return result.count === 1;
}

export async function incrementFreelancerCompletionStats(
  freelancerUserId: string,
  agreedPriceMmk: bigint,
  client: DeliverableTransactionClient,
): Promise<boolean> {
  const result = await client.freelancerProfile.updateMany({
    where: {
      user_id: freelancerUserId,
      deleted_at: null,
    },
    data: {
      completed_projects_count: { increment: 1 },
      total_earnings_mmk: { increment: agreedPriceMmk },
    },
  });

  return result.count === 1;
}

export { createSystemMessage };
