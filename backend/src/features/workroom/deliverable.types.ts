import type { Prisma } from '../../../prisma/generated/prisma/client.js';

export const deliverableSelect = {
  id: true,
  order_id: true,
  file_name: true,
  file_url_clean: true,
  file_url_watermarked: true,
  file_size_bytes: true,
  status: true,
  submitted_at: true,
  approved_at: true,
} satisfies Prisma.DeliverableSelect;

export const deliveryOrderSelect = {
  id: true,
  client_id: true,
  freelancer_id: true,
  agreed_price_mmk: true,
  status: true,
  deleted_at: true,
} satisfies Prisma.OrderSelect;

export type DeliverableRecord = Prisma.DeliverableGetPayload<{
  select: typeof deliverableSelect;
}>;

export type DeliveryOrderRecord = Prisma.OrderGetPayload<{
  select: typeof deliveryOrderSelect;
}>;

export type DeliverableDatabaseClient =
  | typeof import('../../config/prisma.js').prisma
  | Prisma.TransactionClient;
