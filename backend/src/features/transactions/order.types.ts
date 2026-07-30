import type { Prisma } from '../../../prisma/generated/prisma/client.js';

export const orderSelect = {
  id: true,
  client_id: true,
  freelancer_id: true,
  source_type: true,
  package_id: true,
  job_post_id: true,
  agreed_price_mmk: true,
  platform_fee_mmk: true,
  status: true,
  is_escrow_funded: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.OrderSelect;

export type OrderRecord = Prisma.OrderGetPayload<{ select: typeof orderSelect }>;

export type PackageOrderSource = {
  id: string;
  freelancer_id: string;
  price_mmk: bigint;
  freelancer: {
    user_id: string;
  };
};

export type JobOrderSource = {
  id: string;
  budget_min_mmk: bigint | null;
  budget_max_mmk: bigint | null;
  client: {
    user_id: string;
  };
};

export type FreelancerAccount = {
  id: string;
  status: 'LEAD' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  freelancer_profile: {
    id: string;
  } | null;
};

export type FreelancerPlan = {
  max_active_orders: number;
  commission_rate: { toString(): string };
};

export type PaymentOrderRecord = {
  id: string;
  client_id: string;
  agreed_price_mmk: bigint;
  status: 'AWAITING_ESCROW' | 'ACTIVE' | 'IN_REVIEW' | 'COMPLETED' | 'DISPUTED' | 'CANCELED';
};

export type PaymentRecord = {
  id: string;
  order_id: string;
  amount_mmk: bigint;
  payment_method_id: string | null;
  transaction_ref: string | null;
  status: 'PENDING_ADMIN' | 'VERIFIED' | 'REJECTED';
  created_at: Date;
  updated_at: Date;
};
