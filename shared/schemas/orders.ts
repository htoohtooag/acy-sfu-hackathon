import { z } from 'zod';

const positiveMoneyString = z
  .string()
  .regex(/^[1-9][0-9]*$/, 'Money must be a positive integer string.');

const packageOrderSchema = z
  .object({
    package_id: z.uuid(),
  })
  .strict();

const customOfferOrderSchema = z
  .object({
    job_post_id: z.uuid(),
    freelancer_id: z.uuid(),
    agreed_price_mmk: positiveMoneyString,
  })
  .strict();

export const createOrderSchema = z.union([
  packageOrderSchema,
  customOfferOrderSchema,
]);

export const orderQuoteRequestSchema = packageOrderSchema;

export const orderQuoteResponseSchema = z.object({
  package_id: z.uuid(),
  agreed_price_mmk: positiveMoneyString,
  platform_fee_mmk: z.string().regex(/^[0-9]+$/, 'Money must be a nonnegative integer string.'),
}).strict();

export const orderIdSchema = z.object({ id: z.uuid() });

export const orderListQuerySchema = z.object({
  role: z.enum(['client', 'freelancer']),
  status: z.enum(['active', 'completed', 'in_review']).optional(),
}).strict();

export const orderStatusSchema = z.enum([
  'AWAITING_ESCROW',
  'ACTIVE',
  'IN_REVIEW',
  'COMPLETED',
  'DISPUTED',
  'CANCELED',
]);

export const orderParticipantSchema = z.object({
  id: z.uuid(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
}).strict();

export const orderSourceSummarySchema = z.object({
  id: z.uuid(),
  title: z.string(),
}).strict();

export const paymentProofFieldsSchema = z
  .object({
    amount_mmk: positiveMoneyString,
    payment_method_id: z.uuid(),
    transaction_ref: z.string().trim().max(255).optional(),
  })
  .strict();

export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
export type OrderQuoteRequest = z.infer<typeof orderQuoteRequestSchema>;
export type OrderQuoteResponse = z.infer<typeof orderQuoteResponseSchema>;
export type PaymentProofFields = z.infer<typeof paymentProofFieldsSchema>;
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;

export type OrderResponse = {
  id: string;
  client_id: string;
  freelancer_id: string;
  source_type: 'PACKAGE' | 'CUSTOM_OFFER';
  package_id: string | null;
  job_post_id: string | null;
  agreed_price_mmk: string;
  platform_fee_mmk: string;
  status: 'AWAITING_ESCROW' | 'ACTIVE' | 'IN_REVIEW' | 'COMPLETED' | 'DISPUTED' | 'CANCELED';
  is_escrow_funded: boolean;
  created_at: string;
  updated_at: string;
};

export type PaymentResponse = {
  id: string;
  order_id: string;
  amount_mmk: string;
  payment_method_id: string | null;
  transaction_ref: string | null;
  status: 'PENDING_ADMIN' | 'VERIFIED' | 'REJECTED';
  created_at: string;
  updated_at: string;
};

export type OrderParticipant = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type OrderSourceSummary = {
  id: string;
  title: string;
};

export type OrderListItem = {
  id: string;
  client_id: string;
  freelancer_id: string;
  source_type: 'PACKAGE' | 'CUSTOM_OFFER';
  package_id: string | null;
  job_post_id: string | null;
  agreed_price_mmk: string;
  platform_fee_mmk: string;
  status: OrderResponse['status'];
  is_escrow_funded: boolean;
  created_at: string;
  updated_at: string;
  freelancer: OrderParticipant;
  other_party: OrderParticipant;
  source: OrderSourceSummary | null;
};

export const orderListItemSchema = z.object({
  id: z.uuid(),
  client_id: z.uuid(),
  freelancer_id: z.uuid(),
  source_type: z.enum(['PACKAGE', 'CUSTOM_OFFER']),
  package_id: z.uuid().nullable(),
  job_post_id: z.uuid().nullable(),
  agreed_price_mmk: z.string(),
  platform_fee_mmk: z.string(),
  status: orderStatusSchema,
  is_escrow_funded: z.boolean(),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
  freelancer: orderParticipantSchema,
  other_party: orderParticipantSchema,
  source: orderSourceSummarySchema.nullable(),
}).strict();

export const orderListResponseSchema = z.array(orderListItemSchema);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export type OrderPaymentSummary = {
  id: string;
  amount_mmk: string;
  status: 'PENDING_ADMIN' | 'VERIFIED' | 'REJECTED';
  transaction_ref: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderDeliverableSummary = {
  id: string;
  file_name: string;
  file_size_bytes: string | null;
  status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  submitted_at: string;
  approved_at: string | null;
};

const orderPaymentSummarySchema = z.object({
  id: z.uuid(),
  amount_mmk: z.string(),
  status: z.enum(['PENDING_ADMIN', 'VERIFIED', 'REJECTED']),
  transaction_ref: z.string().nullable(),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
}).strict();

const orderDeliverableSummarySchema = z.object({
  id: z.uuid(),
  file_name: z.string(),
  file_size_bytes: z.string().nullable(),
  status: z.enum(['UNDER_REVIEW', 'APPROVED', 'REJECTED']),
  submitted_at: z.iso.datetime({ offset: true }),
  approved_at: z.iso.datetime({ offset: true }).nullable(),
}).strict();

const orderTierSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  display_name: z.string().nullable(),
}).strict();

const orderPackageSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  price_mmk: z.string(),
  delivery_days: z.number().int().positive(),
  tier: orderTierSchema.nullable(),
}).strict();

const orderJobPostSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string(),
  budget_min_mmk: z.string().nullable(),
  budget_max_mmk: z.string().nullable(),
}).strict();

export const orderDetailSchema = orderListItemSchema.extend({
  client: orderParticipantSchema,
  freelancer: orderParticipantSchema,
  package: orderPackageSchema.nullable(),
  job_post: orderJobPostSchema.nullable(),
  payments: z.array(orderPaymentSummarySchema),
  deliverables: z.array(orderDeliverableSummarySchema),
}).strict();

export type OrderDetail = OrderListItem & {
  client: OrderParticipant;
  freelancer: OrderParticipant;
  package: {
    id: string;
    title: string;
    description: string | null;
    price_mmk: string;
    delivery_days: number;
    tier: { id: string; name: string; display_name: string | null } | null;
  } | null;
  job_post: {
    id: string;
    title: string;
    description: string;
    budget_min_mmk: string | null;
    budget_max_mmk: string | null;
  } | null;
  payments: OrderPaymentSummary[];
  deliverables: OrderDeliverableSummary[];
};
