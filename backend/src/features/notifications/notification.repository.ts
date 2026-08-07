import type {
  NotificationCategory,
  NotificationListQuery,
  NotificationMetadataWithLink,
} from 'shared/schemas';
import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { notificationSelect } from './notification.types.js';
import type { NotificationRecord } from './notification.types.js';

export type NotificationDatabaseClient = Prisma.TransactionClient | typeof prisma;

export type CreateNotificationInput = {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string | null;
  metadata: NotificationMetadataWithLink;
};

function toPrismaJsonValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Notification metadata contains a nonfinite number.');
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toPrismaJsonValue);
  }

  if (typeof value === 'object') {
    const objectValue: Record<string, Prisma.InputJsonValue | null> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      objectValue[key] = toPrismaJsonValue(nestedValue);
    }

    return objectValue;
  }

  throw new Error('Notification metadata contains an unsupported value.');
}

function toPrismaJsonObject(value: NotificationMetadataWithLink): Prisma.InputJsonObject {
  const jsonValue = toPrismaJsonValue(value);
  if (!isPrismaJsonObject(jsonValue)) {
    throw new Error('Notification metadata must be a JSON object.');
  }

  return jsonValue;
}

function isPrismaJsonObject(
  value: Prisma.InputJsonValue | null,
): value is Prisma.InputJsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && !('toJSON' in value);
}

export async function createNotification(
  input: CreateNotificationInput,
  client: NotificationDatabaseClient = prisma,
): Promise<NotificationRecord> {
  return client.notification.create({
    data: {
      user_id: input.userId,
      category: input.category,
      title: input.title,
      body: input.body,
      metadata: toPrismaJsonObject(input.metadata),
    },
    select: notificationSelect,
  });
}

function buildNotificationWhere(
  userId: string,
  query: NotificationListQuery,
): Prisma.NotificationWhereInput {
  const where: Prisma.NotificationWhereInput = {
    user_id: userId,
  };

  if (query.category !== undefined) {
    where.category = query.category;
  }

  if (query.unreadOnly) {
    where.is_read = false;
  }

  return where;
}

export async function countNotifications(
  userId: string,
  query: NotificationListQuery,
  client: NotificationDatabaseClient = prisma,
): Promise<number> {
  return client.notification.count({
    where: buildNotificationWhere(userId, query),
  });
}

export async function findNotifications(
  userId: string,
  query: NotificationListQuery,
  client: NotificationDatabaseClient = prisma,
): Promise<NotificationRecord[]> {
  return client.notification.findMany({
    where: buildNotificationWhere(userId, query),
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    skip: (query.page - 1) * query.page_size,
    take: query.page_size,
    select: notificationSelect,
  });
}

export async function findNotificationById(
  userId: string,
  notificationId: string,
  client: NotificationDatabaseClient = prisma,
): Promise<NotificationRecord | null> {
  return client.notification.findFirst({
    where: {
      id: notificationId,
      user_id: userId,
    },
    select: notificationSelect,
  });
}

export async function markNotificationRead(
  notificationId: string,
  client: Prisma.TransactionClient,
): Promise<NotificationRecord> {
  return client.notification.update({
    where: { id: notificationId },
    data: { is_read: true },
    select: notificationSelect,
  });
}

export async function markAllNotificationsRead(
  userId: string,
  client: NotificationDatabaseClient = prisma,
): Promise<number> {
  const result = await client.notification.updateMany({
    where: {
      user_id: userId,
      is_read: false,
    },
    data: { is_read: true },
  });

  return result.count;
}
