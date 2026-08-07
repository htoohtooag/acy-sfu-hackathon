import { z } from 'zod';

export const notificationCategorySchema = z.enum([
  'SYSTEM_ACCOUNT',
  'ORDERS_ESCROW',
  'OFFERS_PROPOSALS',
]);

export const notificationIdSchema = z
  .object({ id: z.uuid() })
  .strict();

const notificationBooleanQuerySchema = z.preprocess(
  (value: unknown) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  },
  z.boolean().default(false),
);

export const notificationListQuerySchema = z
  .object({
    category: notificationCategorySchema.optional(),
    unreadOnly: notificationBooleanQuerySchema,
    page: z.coerce.number().int().positive().default(1),
    page_size: z.coerce.number().int().positive().max(50).default(20),
  })
  .strict();

export const notificationMarkAllReadSchema = z
  .object({})
  .strict()
  .default({});

export const notificationMetadataSchema = z.record(z.string(), z.unknown());

export const notificationMetadataWithLinkSchema = z
  .object({
    link: z.string().trim().min(1).max(2048).startsWith('/'),
  })
  .catchall(z.unknown());

export const notificationResponseSchema = z
  .object({
    id: z.uuid(),
    category: notificationCategorySchema,
    title: z.string(),
    body: z.string().nullable(),
    is_read: z.boolean(),
    metadata: notificationMetadataSchema,
    created_at: z.iso.datetime({ offset: true }),
  })
  .strict();

export const notificationListResponseSchema = z
  .object({
    items: z.array(notificationResponseSchema),
    page: z.number().int().positive(),
    page_size: z.number().int().positive().max(50),
    total_items: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  })
  .strict();

export const notificationMarkAllReadResponseSchema = z
  .object({ updated_count: z.number().int().nonnegative() })
  .strict();

export type NotificationCategory = z.infer<typeof notificationCategorySchema>;
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
export type NotificationMetadata = z.infer<typeof notificationMetadataSchema>;
export type NotificationMetadataWithLink = z.infer<typeof notificationMetadataWithLinkSchema>;
export type NotificationResponse = z.infer<typeof notificationResponseSchema>;
export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;
export type NotificationMarkAllReadResponse = z.infer<typeof notificationMarkAllReadResponseSchema>;
