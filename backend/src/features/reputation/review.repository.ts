import type { CreateReviewRequest } from 'shared/schemas';
import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import {
  freelancerProfileSelect,
  reviewOrderSelect,
  reviewSelect,
} from './review.types.js';
import type {
  FreelancerProfileRecord,
  ReviewDatabaseClient,
  ReviewOrderRecord,
  ReviewRecord,
  ReviewTransactionClient,
} from './review.types.js';

export async function findReviewOrder(
  orderId: string,
  client: ReviewDatabaseClient = prisma,
): Promise<ReviewOrderRecord | null> {
  return client.order.findFirst({
    where: {
      id: orderId,
      deleted_at: null,
    },
    select: reviewOrderSelect,
  });
}

export async function findExistingReview(
  orderId: string,
  reviewerId: string,
  client: ReviewDatabaseClient = prisma,
): Promise<{ id: string } | null> {
  return client.review.findUnique({
    where: {
      order_id_reviewer_id: {
        order_id: orderId,
        reviewer_id: reviewerId,
      },
    },
    select: { id: true },
  });
}

export async function createReview(
  input: {
    orderId: string;
    reviewerId: string;
    revieweeId: string;
    fields: CreateReviewRequest;
  },
  client: ReviewTransactionClient,
): Promise<ReviewRecord> {
  return client.review.create({
    data: {
      order_id: input.orderId,
      reviewer_id: input.reviewerId,
      reviewee_id: input.revieweeId,
      rating: input.fields.rating,
      comment: input.fields.comment ?? null,
    },
    select: reviewSelect,
  });
}

export async function findFreelancerProfile(
  freelancerUserId: string,
  client: ReviewDatabaseClient = prisma,
): Promise<FreelancerProfileRecord | null> {
  return client.freelancerProfile.findFirst({
    where: {
      user_id: freelancerUserId,
      deleted_at: null,
    },
    select: freelancerProfileSelect,
  });
}

export async function aggregateFreelancerRatings(
  freelancerUserId: string,
  client: ReviewTransactionClient,
): Promise<{ sum: number; count: number }> {
  const aggregate = await client.review.aggregate({
    where: {
      reviewee_id: freelancerUserId,
      deleted_at: null,
    },
    _sum: { rating: true },
    _count: { rating: true },
  });

  return {
    sum: aggregate._sum.rating ?? 0,
    count: aggregate._count.rating,
  };
}

export async function updateFreelancerSuccessRate(
  profileId: string,
  successRate: string,
  client: ReviewTransactionClient,
): Promise<FreelancerProfileRecord> {
  return client.freelancerProfile.update({
    where: { id: profileId },
    data: { success_rate: successRate },
    select: freelancerProfileSelect,
  });
}

export function isPrismaKnownError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}
