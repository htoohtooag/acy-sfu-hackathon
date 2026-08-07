import {
  notificationMetadataWithLinkSchema,
} from 'shared/schemas';
import type {
  NotificationCategory,
  NotificationListQuery,
  NotificationListResponse,
  NotificationMarkAllReadResponse,
  NotificationMetadataWithLink,
  NotificationResponse,
} from 'shared/schemas';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import {
  countNotifications,
  createNotification,
  findNotificationById,
  findNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './notification.repository.js';
import type { CreateNotificationInput } from './notification.repository.js';
import { emitNotification } from './notification.socket.js';
import { mapNotification } from './notification.types.js';
import type { NotificationRecord } from './notification.types.js';

type NotificationSenderDependencies = {
  create: (input: CreateNotificationInput) => Promise<NotificationRecord>;
  emit: (userId: string, payload: NotificationResponse) => void;
};

export type NotificationSender = (
  userId: string,
  category: NotificationCategory,
  title: string,
  body: string | null,
  metadata: NotificationMetadataWithLink,
) => Promise<NotificationResponse>;

export function createNotificationSender(
  dependencies: NotificationSenderDependencies = {
    create: createNotification,
    emit: emitNotification,
  },
): NotificationSender {
  return async function sendNotification(
    userId: string,
    category: NotificationCategory,
    title: string,
    body: string | null,
    metadata: NotificationMetadataWithLink,
  ): Promise<NotificationResponse> {
    const validatedMetadata = notificationMetadataWithLinkSchema.parse(metadata);
    const notification = await dependencies.create({
      userId,
      category,
      title,
      body,
      metadata: validatedMetadata,
    });
    const response = mapNotification(notification);

    try {
      dependencies.emit(userId, response);
    } catch (error: unknown) {
      console.error('Notification socket emission failed.', {
        notification_id: response.id,
        user_id: userId,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      });
    }

    return response;
  };
}

export const sendNotification = createNotificationSender();

export async function listUserNotifications(
  userId: string,
  query: NotificationListQuery,
): Promise<NotificationListResponse> {
  const [totalItems, records] = await prisma.$transaction(async (transaction) => {
    return Promise.all([
      countNotifications(userId, query, transaction),
      findNotifications(userId, query, transaction),
    ]);
  });

  return {
    items: records.map(mapNotification),
    page: query.page,
    page_size: query.page_size,
    total_items: totalItems,
    total_pages: Math.ceil(totalItems / query.page_size),
  };
}

export async function markUserNotificationRead(
  userId: string,
  notificationId: string,
): Promise<NotificationResponse> {
  return prisma.$transaction(async (transaction) => {
    const notification = await findNotificationById(userId, notificationId, transaction);

    if (notification === null) {
      throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', 'The notification was not found.');
    }

    const updatedNotification = await markNotificationRead(notification.id, transaction);
    return mapNotification(updatedNotification);
  });
}

export async function markAllUserNotificationsRead(
  userId: string,
): Promise<NotificationMarkAllReadResponse> {
  return {
    updated_count: await markAllNotificationsRead(userId),
  };
}
