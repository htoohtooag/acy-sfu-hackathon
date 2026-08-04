import type { CreateOrderRequest, OrderListQuery, PaymentProofFields } from 'shared/schemas';
import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import type {
  FreelancerAccount,
  FreelancerPlan,
  JobOrderSource,
  OrderRecord,
  PackageOrderSource,
  PaymentOrderRecord,
  PaymentRecord,
  OrderDetailReadRecord,
  OrderListReadRecord,
} from './order.types.js';
import { orderDetailReadSelect, orderListReadSelect, orderSelect } from './order.types.js';

export type TransactionClient = Prisma.TransactionClient;
export type OrderClient = TransactionClient | typeof prisma;

export async function findAvailablePackage(
  packageId: string,
  client: OrderClient = prisma,
): Promise<PackageOrderSource | null> {
  return client.package.findFirst({
    where: {
      id: packageId,
      deleted_at: null,
      is_active: true,
      freelancer: {
        deleted_at: null,
        user: {
          deleted_at: null,
          status: 'ACTIVE',
          roles: { some: { role: { name: 'FREELANCER' } } },
        },
      },
    },
    select: {
      id: true,
      freelancer_id: true,
      price_mmk: true,
      freelancer: { select: { user_id: true } },
    },
  });
}

export async function findAvailableJobPost(
  jobPostId: string,
  clientUserId: string,
  client: OrderClient = prisma,
): Promise<JobOrderSource | null> {
  return client.jobPost.findFirst({
    where: {
      id: jobPostId,
      deleted_at: null,
      status: 'OPEN',
      client: {
        user_id: clientUserId,
        user: { deleted_at: null, status: 'ACTIVE' },
      },
    },
    select: {
      id: true,
      budget_min_mmk: true,
      budget_max_mmk: true,
      client: { select: { user_id: true } },
    },
  });
}

export async function findFreelancerAccount(
  userId: string,
  client: OrderClient = prisma,
): Promise<FreelancerAccount | null> {
  return client.user.findFirst({
    where: {
      id: userId,
      deleted_at: null,
      status: { in: ['LEAD', 'ACTIVE'] },
      roles: { some: { role: { name: 'FREELANCER' } } },
    },
    select: {
      id: true,
      status: true,
      freelancer_profile: {
        select: { id: true },
        where: { deleted_at: null },
      },
    },
  });
}

export async function findActiveFreelancerPlan(
  userId: string,
  client: OrderClient = prisma,
): Promise<FreelancerPlan | null> {
  return client.userSubscription.findFirst({
    where: {
      user_id: userId,
      status: 'ACTIVE',
      OR: [{ ends_at: null }, { ends_at: { gt: new Date() } }],
      plan: { audience: 'FREELANCER', is_active: true },
    },
    orderBy: { created_at: 'desc' },
    select: {
      plan: { select: { max_active_orders: true, commission_rate: true } },
    },
  }).then((subscription) => subscription?.plan ?? null);
}

export async function countActiveFreelancerOrders(
  freelancerId: string,
  client: OrderClient = prisma,
): Promise<number> {
  return client.order.count({
    where: {
      freelancer_id: freelancerId,
      deleted_at: null,
      status: { notIn: ['COMPLETED', 'CANCELED'] },
    },
  });
}

export async function createOrder(
  input: {
    client_id: string;
    freelancer_id: string;
    source_type: 'PACKAGE' | 'CUSTOM_OFFER';
    package_id: string | null;
    job_post_id: string | null;
    agreed_price_mmk: bigint;
    platform_fee_mmk: bigint;
  },
  client: TransactionClient,
): Promise<{ id: string }> {
  return client.order.create({
    data: {
      client_id: input.client_id,
      freelancer_id: input.freelancer_id,
      source_type: input.source_type,
      package_id: input.package_id,
      job_post_id: input.job_post_id,
      agreed_price_mmk: input.agreed_price_mmk,
      platform_fee_mmk: input.platform_fee_mmk,
      status: 'AWAITING_ESCROW',
      is_escrow_funded: false,
    },
    select: { id: true },
  });
}

export async function markJobPostHiring(
  jobPostId: string,
  client: TransactionClient,
): Promise<boolean> {
  const result = await client.jobPost.updateMany({
    where: { id: jobPostId, deleted_at: null, status: 'OPEN' },
    data: { status: 'HIRING' },
  });
  return result.count === 1;
}

export async function findOrderById(
  orderId: string,
  client: OrderClient = prisma,
): Promise<OrderRecord | null> {
  return client.order.findFirst({
    where: { id: orderId, deleted_at: null },
    select: orderSelect,
  });
}

function toOrderStatus(status: OrderListQuery['status']): 'ACTIVE' | 'COMPLETED' | 'IN_REVIEW' | undefined {
  if (status === undefined) return undefined;
  return status === 'active' ? 'ACTIVE' : status === 'completed' ? 'COMPLETED' : 'IN_REVIEW';
}

export async function listOrdersForUser(
  userId: string,
  query: OrderListQuery,
): Promise<OrderListReadRecord[]> {
  const where: Prisma.OrderWhereInput = {
    deleted_at: null,
    ...(query.role === 'client' ? { client_id: userId } : { freelancer_id: userId }),
  };
  const status = toOrderStatus(query.status);
  if (status !== undefined) where.status = status;

  return prisma.order.findMany({
    where,
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    select: orderListReadSelect,
  });
}

export async function findParticipantOrderDetails(
  orderId: string,
  userId: string,
): Promise<OrderDetailReadRecord | null> {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      deleted_at: null,
      OR: [{ client_id: userId }, { freelancer_id: userId }],
    },
    select: orderDetailReadSelect,
  });
}

export async function findPaymentOrder(
  orderId: string,
  clientUserId: string,
  client: OrderClient = prisma,
): Promise<PaymentOrderRecord | null> {
  return client.order.findFirst({
    where: { id: orderId, client_id: clientUserId, deleted_at: null },
    select: {
      id: true,
      client_id: true,
      agreed_price_mmk: true,
      status: true,
    },
  });
}

export async function hasSubmittedPayment(
  orderId: string,
  client: OrderClient = prisma,
): Promise<boolean> {
  const payment = await client.paymentTransaction.findFirst({
    where: { order_id: orderId, status: { in: ['PENDING_ADMIN', 'VERIFIED'] } },
    select: { id: true },
  });
  return payment !== null;
}

export async function hasActivePaymentMethod(
  paymentMethodId: string,
  client: OrderClient = prisma,
): Promise<boolean> {
  const paymentMethod = await client.paymentMethod.findFirst({
    where: { id: paymentMethodId, is_active: true },
    select: { id: true },
  });
  return paymentMethod !== null;
}

export async function createPayment(
  orderId: string,
  fields: PaymentProofFields,
  screenshotPath: string,
  client: TransactionClient,
): Promise<PaymentRecord> {
  return client.paymentTransaction.create({
    data: {
      order_id: orderId,
      amount_mmk: BigInt(fields.amount_mmk),
      payment_method_id: fields.payment_method_id,
      transaction_ref: fields.transaction_ref ?? null,
      screenshot_url: screenshotPath,
      status: 'PENDING_ADMIN',
    },
    select: {
      id: true,
      order_id: true,
      amount_mmk: true,
      payment_method_id: true,
      transaction_ref: true,
      status: true,
      created_at: true,
      updated_at: true,
    },
  });
}
