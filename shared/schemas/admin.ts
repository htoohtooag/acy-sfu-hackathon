import { z } from 'zod';

const adminRouteIdSchema = z.object({ id: z.uuid() }).strict();

export const adminPaymentIdSchema = adminRouteIdSchema;
export const moderationTargetIdSchema = adminRouteIdSchema;

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
