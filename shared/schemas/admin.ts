import { z } from 'zod';

const adminRouteIdSchema = z.object({ id: z.uuid() }).strict();

export const adminPaymentIdSchema = adminRouteIdSchema;
export const moderationTargetIdSchema = adminRouteIdSchema;
export const adminPaymentListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
}).strict();

export const adminEmptyBodySchema = z.object({}).strict().default({});

const legacyVerifyPaymentSchema = z
  .object({})
  .strict()
  .default({})
  .transform(() => ({ action: 'VERIFY' as const }));

const explicitVerifyPaymentSchema = z
  .object({ action: z.literal('VERIFY') })
  .strict();

const rejectPaymentSchema = z
  .object({
    action: z.literal('REJECT'),
    reason: z.string().trim().min(1).max(1000),
  })
  .strict();

export const paymentDecisionSchema = z.union([
  legacyVerifyPaymentSchema,
  explicitVerifyPaymentSchema,
  rejectPaymentSchema,
]);

export const moderationRequestSchema = z
  .object({
    reason: z.string().trim().min(1).max(1000),
  })
  .strict();

export type ModerationRequest = z.infer<typeof moderationRequestSchema>;
export type PaymentDecisionRequest = z.infer<typeof paymentDecisionSchema>;

export const adminCapabilitySchema = z.enum(['PAYMENT_REVIEW']);

const adminParticipantSchema = z.object({
  id: z.uuid(),
  full_name: z.string().nullable(),
}).strict();

const adminPaymentMethodSchema = z.object({
  id: z.uuid().nullable(),
  name: z.string().nullable(),
  display_name: z.string().nullable(),
  account_name: z.string().nullable(),
}).strict();

const adminPaymentOrderSchema = z.object({
  id: z.uuid(),
  title: z.string(),
}).strict();

export const adminSessionResponseSchema = z.object({
  display_name: z.string().nullable(),
  capabilities: z.array(adminCapabilitySchema),
}).strict();

export const adminPaymentSummarySchema = z.object({
  id: z.uuid(),
  amount_mmk: z.string().regex(/^[0-9]+$/),
  transaction_ref: z.string().nullable(),
  status: z.literal('PENDING_ADMIN'),
  created_at: z.iso.datetime({ offset: true }),
  payment_method: adminPaymentMethodSchema,
  order: adminPaymentOrderSchema,
  client: adminParticipantSchema,
  freelancer: adminParticipantSchema,
}).strict();

export const adminPaymentListResponseSchema = z.object({
  items: z.array(adminPaymentSummarySchema),
  page: z.number().int().positive(),
  page_size: z.number().int().positive().max(50),
  total_items: z.number().int().nonnegative(),
  total_pages: z.number().int().nonnegative(),
}).strict();

export const adminPaymentDetailSchema = adminPaymentSummarySchema.extend({
  agreed_price_mmk: z.string().regex(/^[0-9]+$/),
  screenshot_url: z.string().url(),
}).strict();

export type AdminCapability = z.infer<typeof adminCapabilitySchema>;
export type AdminPaymentListQuery = z.infer<typeof adminPaymentListQuerySchema>;
export type AdminSessionResponse = z.infer<typeof adminSessionResponseSchema>;
export type AdminPaymentSummary = z.infer<typeof adminPaymentSummarySchema>;
export type AdminPaymentListResponse = z.infer<typeof adminPaymentListResponseSchema>;
export type AdminPaymentDetail = z.infer<typeof adminPaymentDetailSchema>;

export type AdminPaymentVerificationResponse = {
  payment_id: string;
  order_id: string;
  amount_mmk: string;
  payment_status: 'VERIFIED';
  verified_by: string;
  verified_at: string;
  order_status: 'ACTIVE';
  is_escrow_funded: true;
};

export type AdminPaymentRejectionResponse = {
  payment_id: string;
  order_id: string;
  amount_mmk: string;
  payment_status: 'REJECTED';
  rejection_reason: string;
  order_status: 'AWAITING_ESCROW';
  is_escrow_funded: false;
};

export type AdminModerationResponse = {
  moderation_id: string;
  target_user_id: string;
  moderation_status: 'ACTIVE';
  user_status: 'SUSPENDED';
  reason: string;
  created_at: string;
};
