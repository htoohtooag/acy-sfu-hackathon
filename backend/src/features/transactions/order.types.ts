import type { OrderDetail, OrderListItem, OrderListQuery } from 'shared/schemas';
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

const participantSelect = {
  id: true,
  full_name: true,
  avatar_url: true,
} satisfies Prisma.UserSelect;

export const orderListReadSelect = {
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
  client: { select: participantSelect },
  freelancer: { select: participantSelect },
  package: { select: { id: true, title: true, deleted_at: true } },
  job_post: { select: { id: true, title: true, deleted_at: true } },
} satisfies Prisma.OrderSelect;

export const orderDetailReadSelect = {
  ...orderListReadSelect,
  package: {
    select: {
      id: true,
      title: true,
      description: true,
      price_mmk: true,
      delivery_days: true,
      deleted_at: true,
      tier: { select: { id: true, name: true, display_name: true } },
    },
  },
  job_post: {
    select: {
      id: true,
      title: true,
      description: true,
      budget_min_mmk: true,
      budget_max_mmk: true,
      deleted_at: true,
    },
  },
  payments: {
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      amount_mmk: true,
      status: true,
      transaction_ref: true,
      created_at: true,
      updated_at: true,
    },
  },
  deliverables: {
    orderBy: [{ submitted_at: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      file_name: true,
      file_size_bytes: true,
      status: true,
      submitted_at: true,
      approved_at: true,
    },
  },
} satisfies Prisma.OrderSelect;

export type OrderListReadRecord = Prisma.OrderGetPayload<{ select: typeof orderListReadSelect }>;
export type OrderDetailReadRecord = Prisma.OrderGetPayload<{ select: typeof orderDetailReadSelect }>;

function mapParticipant(participant: OrderListReadRecord['client']): OrderListItem['other_party'] {
  return participant;
}

function mapBaseOrder(
  record: OrderListReadRecord,
  role: OrderListQuery['role'],
): OrderListItem {
  const source = record.source_type === 'PACKAGE'
    ? record.package?.deleted_at === null
      ? { id: record.package.id, title: record.package.title }
      : null
    : record.job_post?.deleted_at === null
      ? { id: record.job_post.id, title: record.job_post.title }
      : null;

  return {
    id: record.id,
    client_id: record.client_id,
    freelancer_id: record.freelancer_id,
    source_type: record.source_type,
    package_id: record.package_id,
    job_post_id: record.job_post_id,
    agreed_price_mmk: record.agreed_price_mmk.toString(),
    platform_fee_mmk: record.platform_fee_mmk.toString(),
    status: record.status,
    is_escrow_funded: record.is_escrow_funded,
    created_at: record.created_at.toISOString(),
    updated_at: record.updated_at.toISOString(),
    other_party: mapParticipant(role === 'client' ? record.freelancer : record.client),
    source,
  };
}

export function mapOrderListItem(record: OrderListReadRecord, role: OrderListQuery['role']): OrderListItem {
  return mapBaseOrder(record, role);
}

export function mapOrderDetail(record: OrderDetailReadRecord): OrderDetail {
  const base = mapBaseOrder(record, 'client');
  return {
    ...base,
    other_party: record.freelancer,
    client: record.client,
    freelancer: record.freelancer,
    package: record.package?.deleted_at === null ? {
      id: record.package.id,
      title: record.package.title,
      description: record.package.description,
      price_mmk: record.package.price_mmk.toString(),
      delivery_days: record.package.delivery_days,
      tier: record.package.tier,
    } : null,
    job_post: record.job_post?.deleted_at === null ? {
      id: record.job_post.id,
      title: record.job_post.title,
      description: record.job_post.description,
      budget_min_mmk: record.job_post.budget_min_mmk?.toString() ?? null,
      budget_max_mmk: record.job_post.budget_max_mmk?.toString() ?? null,
    } : null,
    payments: record.payments.map((payment) => ({
      id: payment.id,
      amount_mmk: payment.amount_mmk.toString(),
      status: payment.status,
      transaction_ref: payment.transaction_ref,
      created_at: payment.created_at.toISOString(),
      updated_at: payment.updated_at.toISOString(),
    })),
    deliverables: record.deliverables.map((deliverable) => ({
      id: deliverable.id,
      file_name: deliverable.file_name,
      file_size_bytes: deliverable.file_size_bytes?.toString() ?? null,
      status: deliverable.status,
      submitted_at: deliverable.submitted_at.toISOString(),
      approved_at: deliverable.approved_at?.toISOString() ?? null,
    })),
  };
}

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
