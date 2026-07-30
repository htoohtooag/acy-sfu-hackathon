import type { CreateOrderRequest, OrderResponse } from 'shared/schemas';
import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import {
  countActiveFreelancerOrders,
  createOrder,
  findActiveFreelancerPlan,
  findAvailableJobPost,
  findAvailablePackage,
  findFreelancerAccount,
  findOrderById,
  markJobPostHiring,
} from './order.repository.js';
import type { FreelancerPlan } from './order.types.js';

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

function isPackageOrder(input: CreateOrderRequest): input is { package_id: string } {
  return 'package_id' in input;
}

function parseCommissionRate(rate: { toString(): string }): { numerator: bigint; scale: bigint } {
  const value = rate.toString().trim();
  const [wholePart, fractionPart = ''] = value.split('.');

  if (wholePart === undefined || !/^\d+$/.test(wholePart) || !/^\d*$/.test(fractionPart)) {
    throw new ApiError(500, 'SUBSCRIPTION_PLAN_CONFIGURATION_ERROR', 'The freelancer commission rate is invalid.');
  }

  const digits = `${wholePart}${fractionPart}`;
  return { numerator: BigInt(digits === '' ? '0' : digits), scale: 10n ** BigInt(fractionPart.length) };
}

export function calculatePlatformFee(
  agreedPriceMmk: bigint,
  commissionRate: { toString(): string },
): bigint {
  if (agreedPriceMmk <= 0n) {
    throw new ApiError(422, 'INVALID_ORDER_AMOUNT', 'The agreed order amount must be positive.');
  }

  const rate = parseCommissionRate(commissionRate);
  const numerator = agreedPriceMmk * rate.numerator;
  const denominator = 100n * rate.scale;
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;

  return quotient + (remainder * 2n >= denominator ? 1n : 0n);
}

function assertCustomOfferAmount(
  amount: bigint,
  minimum: bigint | null,
  maximum: bigint | null,
): void {
  if (amount <= 0n || (minimum !== null && amount < minimum) || (maximum !== null && amount > maximum)) {
    throw new ApiError(409, 'INVALID_ORDER_AMOUNT', 'The agreed amount is outside the job post budget.');
  }
}

async function resolveFreelancerPlan(
  freelancerUserId: string,
  client: Prisma.TransactionClient,
): Promise<FreelancerPlan> {
  const account = await findFreelancerAccount(freelancerUserId, client);

  if (account === null || account.status !== 'ACTIVE' || account.freelancer_profile === null) {
    throw new ApiError(404, 'FREELANCER_NOT_FOUND', 'The selected freelancer was not found.');
  }

  const plan = await findActiveFreelancerPlan(freelancerUserId, client);
  if (plan === null) {
    throw new ApiError(409, 'SUBSCRIPTION_REQUIRED', 'The freelancer does not have an active subscription.');
  }

  return plan;
}

export async function createMarketplaceOrder(
  clientUserId: string,
  input: CreateOrderRequest,
): Promise<OrderResponse> {
  try {
    return await prisma.$transaction(async (transaction) => {
      let freelancerUserId: string;
      let packageId: string | null = null;
      let jobPostId: string | null = null;
      let agreedPriceMmk: bigint;
      let sourceType: 'PACKAGE' | 'CUSTOM_OFFER';

      if (isPackageOrder(input)) {
        const packageSource = await findAvailablePackage(input.package_id, transaction);
        if (packageSource === null) {
          throw new ApiError(404, 'PACKAGE_NOT_AVAILABLE', 'The package is not available.');
        }

        freelancerUserId = packageSource.freelancer.user_id;
        packageId = packageSource.id;
        agreedPriceMmk = packageSource.price_mmk;
        sourceType = 'PACKAGE';
      } else {
        const jobSource = await findAvailableJobPost(input.job_post_id, clientUserId, transaction);
        if (jobSource === null) {
          throw new ApiError(404, 'JOB_POST_NOT_AVAILABLE', 'The job post is not available.');
        }

        agreedPriceMmk = BigInt(input.agreed_price_mmk);
        assertCustomOfferAmount(agreedPriceMmk, jobSource.budget_min_mmk, jobSource.budget_max_mmk);
        freelancerUserId = input.freelancer_id;
        jobPostId = jobSource.id;
        sourceType = 'CUSTOM_OFFER';
      }

      if (freelancerUserId === clientUserId) {
        throw new ApiError(409, 'SELF_ORDER_NOT_ALLOWED', 'You cannot create an order with yourself.');
      }

      const freelancerPlan = await resolveFreelancerPlan(freelancerUserId, transaction);
      const activeOrderCount = await countActiveFreelancerOrders(freelancerUserId, transaction);
      if (activeOrderCount >= freelancerPlan.max_active_orders) {
        throw new ApiError(409, 'ACTIVE_ORDER_LIMIT_REACHED', 'The freelancer has reached the active order limit.');
      }

      const platformFeeMmk = calculatePlatformFee(agreedPriceMmk, freelancerPlan.commission_rate);

      if (jobPostId !== null) {
        const movedToHiring = await markJobPostHiring(jobPostId, transaction);
        if (!movedToHiring) {
          throw new ApiError(409, 'JOB_POST_NOT_AVAILABLE', 'The job post is no longer available.');
        }
      }

      const createdOrder = await createOrder(
        {
          client_id: clientUserId,
          freelancer_id: freelancerUserId,
          source_type: sourceType,
          package_id: packageId,
          job_post_id: jobPostId,
          agreed_price_mmk: agreedPriceMmk,
          platform_fee_mmk: platformFeeMmk,
        },
        transaction,
      );

      const order = await findOrderById(createdOrder.id, transaction);
      if (order === null) {
        throw new ApiError(500, 'ORDER_CREATE_FAILED', 'The order could not be loaded after creation.');
      }

      return mapOrder(order);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (isPrismaError(error, 'P2034')) {
      throw new ApiError(409, 'ORDER_RETRY_REQUIRED', 'The order changed while it was being created. Please retry.');
    }

    if (isPrismaError(error, 'P2002')) {
      throw new ApiError(409, 'ORDER_SOURCE_CONFLICT', 'The order source conflicts with the database constraints.');
    }

    throw error;
  }
}

export function mapOrder(order: {
  id: string;
  client_id: string;
  freelancer_id: string;
  source_type: 'PACKAGE' | 'CUSTOM_OFFER';
  package_id: string | null;
  job_post_id: string | null;
  agreed_price_mmk: bigint;
  platform_fee_mmk: bigint;
  status: 'AWAITING_ESCROW' | 'ACTIVE' | 'IN_REVIEW' | 'COMPLETED' | 'DISPUTED' | 'CANCELED';
  is_escrow_funded: boolean;
  created_at: Date;
  updated_at: Date;
}): OrderResponse {
  return {
    id: order.id,
    client_id: order.client_id,
    freelancer_id: order.freelancer_id,
    source_type: order.source_type,
    package_id: order.package_id,
    job_post_id: order.job_post_id,
    agreed_price_mmk: order.agreed_price_mmk.toString(),
    platform_fee_mmk: order.platform_fee_mmk.toString(),
    status: order.status,
    is_escrow_funded: order.is_escrow_funded,
    created_at: order.created_at.toISOString(),
    updated_at: order.updated_at.toISOString(),
  };
}
