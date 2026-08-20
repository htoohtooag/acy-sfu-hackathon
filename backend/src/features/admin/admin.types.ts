import type {
  AdminPaymentDetail,
  AdminPaymentListResponse,
  AdminPaymentSummary,
  AdminSessionResponse,
} from 'shared/schemas';
import type { Prisma } from '../../../prisma/generated/prisma/client.js';

export const paymentVerificationSelect = {
  id: true,
  order_id: true,
  amount_mmk: true,
  status: true,
  rejection_reason: true,
  verified_by: true,
  verified_at: true,
  order: {
    select: {
      id: true,
      client_id: true,
      freelancer_id: true,
      status: true,
      is_escrow_funded: true,
      deleted_at: true,
    },
  },
} satisfies Prisma.PaymentTransactionSelect;

export type PaymentVerificationRecord = Prisma.PaymentTransactionGetPayload<{
  select: typeof paymentVerificationSelect;
}>;

export const moderationSelect = {
  id: true,
  user_id: true,
  reason: true,
  status: true,
  created_at: true,
} satisfies Prisma.UserModerationSelect;

export type ModerationRecord = Prisma.UserModerationGetPayload<{
  select: typeof moderationSelect;
}>;

export type AdminRoleName = 'SUPER_ADMIN' | 'FINANCE_ADMIN' | 'MODERATION_ADMIN';

export type AdminAssignment = {
  is_active: boolean;
  user: { full_name: string | null };
  admin_role: { name: string } | null;
};

const adminPaymentRelations = {
  order: {
    select: {
      id: true,
      agreed_price_mmk: true,
      client: { select: { id: true, full_name: true } },
      freelancer: { select: { id: true, full_name: true } },
      package: { select: { id: true, title: true, deleted_at: true } },
      job_post: { select: { id: true, title: true, deleted_at: true } },
    },
  },
  payment_method: {
    select: { id: true, name: true, display_name: true, account_name: true },
  },
} satisfies Prisma.PaymentTransactionSelect;

export const adminPaymentReadSelect = {
  id: true,
  order_id: true,
  amount_mmk: true,
  payment_method_id: true,
  transaction_ref: true,
  screenshot_url: true,
  status: true,
  created_at: true,
  ...adminPaymentRelations,
} satisfies Prisma.PaymentTransactionSelect;

export type AdminPaymentReadRecord = Prisma.PaymentTransactionGetPayload<{
  select: typeof adminPaymentReadSelect;
}>;

export type AdminPaymentPage = AdminPaymentListResponse;
export type AdminPaymentDetailResponse = AdminPaymentDetail;
export type AdminSession = AdminSessionResponse;
export type AdminPaymentSummaryResponse = AdminPaymentSummary;
