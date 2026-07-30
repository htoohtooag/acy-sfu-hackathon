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

export const orderIdSchema = z.object({ id: z.uuid() });

export const paymentProofFieldsSchema = z
  .object({
    amount_mmk: positiveMoneyString,
    payment_method_id: z.uuid(),
    transaction_ref: z.string().trim().max(255).optional(),
  })
  .strict();

export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
export type PaymentProofFields = z.infer<typeof paymentProofFieldsSchema>;

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
