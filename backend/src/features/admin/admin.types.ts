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
  admin_role: { name: string } | null;
};
