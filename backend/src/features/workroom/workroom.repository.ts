import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import {
  workroomMessageSelect,
  workroomOrderSelect,
} from './workroom.types.js';
import type {
  WorkroomDatabaseClient,
  WorkroomMessageRecord,
  WorkroomOrderRecord,
} from './workroom.types.js';

export type WorkroomTransactionClient = Prisma.TransactionClient;

export async function findParticipantOrder(
  orderId: string,
  userId: string,
  client: WorkroomDatabaseClient = prisma,
): Promise<WorkroomOrderRecord | null> {
  return client.order.findFirst({
    where: {
      id: orderId,
      deleted_at: null,
      OR: [{ client_id: userId }, { freelancer_id: userId }],
    },
    select: workroomOrderSelect,
  });
}

export async function countOrderMessages(
  orderId: string,
  client: WorkroomDatabaseClient = prisma,
): Promise<number> {
  return client.message.count({
    where: {
      order_id: orderId,
      deleted_at: null,
    },
  });
}

export async function findOrderMessages(
  orderId: string,
  page: number,
  pageSize: number,
  client: WorkroomDatabaseClient = prisma,
): Promise<WorkroomMessageRecord[]> {
  return client.message.findMany({
    where: {
      order_id: orderId,
      deleted_at: null,
    },
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: workroomMessageSelect,
  });
}

export async function createTextMessage(
  orderId: string,
  senderId: string,
  content: string,
  client: WorkroomTransactionClient,
): Promise<WorkroomMessageRecord> {
  return client.message.create({
    data: {
      order_id: orderId,
      sender_id: senderId,
      type: 'TEXT',
      content,
    },
    select: workroomMessageSelect,
  });
}

export async function createFileMessage(
  id: string,
  orderId: string,
  senderId: string,
  attachmentPath: string,
  client: WorkroomTransactionClient,
): Promise<WorkroomMessageRecord> {
  return client.message.create({
    data: {
      id,
      order_id: orderId,
      sender_id: senderId,
      type: 'FILE',
      content: null,
      attachment_url: attachmentPath,
      attachment_type: 'IMAGE',
    },
    select: workroomMessageSelect,
  });
}

export async function createSystemMessage(
  orderId: string,
  senderId: string,
  content: string,
  client: WorkroomTransactionClient,
): Promise<WorkroomMessageRecord> {
  return client.message.create({
    data: {
      order_id: orderId,
      sender_id: senderId,
      type: 'SYSTEM',
      content,
    },
    select: workroomMessageSelect,
  });
}
