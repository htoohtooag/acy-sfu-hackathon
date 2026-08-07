import {
  notificationMetadataSchema,
  type NotificationResponse,
} from 'shared/schemas';
import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const notificationSelect = {
  id: true,
  user_id: true,
  category: true,
  title: true,
  body: true,
  is_read: true,
  metadata: true,
  created_at: true,
} satisfies Prisma.NotificationSelect;

export type NotificationRecord = Prisma.NotificationGetPayload<{
  select: typeof notificationSelect;
}>;

export function mapNotification(record: NotificationRecord): NotificationResponse {
  const metadata = notificationMetadataSchema.safeParse(record.metadata);

  return {
    id: record.id,
    category: record.category,
    title: record.title,
    body: record.body,
    is_read: record.is_read,
    metadata: metadata.success ? metadata.data : {},
    created_at: record.created_at.toISOString(),
  };
}
