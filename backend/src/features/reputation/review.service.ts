import type { CreateReviewRequest, ReviewResponse } from 'shared/schemas';
import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import {
  aggregateFreelancerRatings,
  createReview,
  findExistingReview,
  findFreelancerProfile,
  findReviewOrder,
  isPrismaKnownError,
  updateFreelancerSuccessRate,
} from './review.repository.js';
import { mapReview } from './review.types.js';

export function calculateSuccessRate(ratingSum: number, ratingCount: number): string {
  if (!Number.isInteger(ratingSum) || !Number.isInteger(ratingCount) || ratingCount <= 0) {
    throw new ApiError(500, 'REVIEW_AGGREGATE_INVALID', 'The freelancer review aggregate is invalid.');
  }

  return ((ratingSum / (ratingCount * 5)) * 100).toFixed(2);
}

export async function createClientReview(
  reviewerId: string,
  orderId: string,
  fields: CreateReviewRequest,
): Promise<ReviewResponse> {
  try {
    return await prisma.$transaction(async (transaction) => {
      const order = await findReviewOrder(orderId, transaction);

      if (order === null) {
        throw new ApiError(404, 'ORDER_NOT_FOUND', 'The order was not found.');
      }

      if (order.client_id !== reviewerId) {
        throw new ApiError(403, 'REVIEW_ACCESS_DENIED', 'Only the order client can submit this review.');
      }

      if (order.status !== 'COMPLETED') {
        throw new ApiError(403, 'ORDER_NOT_COMPLETED', 'Reviews are available only for completed orders.');
      }

      const existingReview = await findExistingReview(order.id, reviewerId, transaction);
      if (existingReview !== null) {
        throw new ApiError(409, 'REVIEW_ALREADY_EXISTS', 'You have already reviewed this order.');
      }

      const freelancerProfile = await findFreelancerProfile(order.freelancer_id, transaction);
      if (freelancerProfile === null) {
        throw new ApiError(500, 'FREELANCER_PROFILE_NOT_FOUND', 'The freelancer profile could not be found.');
      }

      const review = await createReview(
        {
          orderId: order.id,
          reviewerId,
          revieweeId: order.freelancer_id,
          fields,
        },
        transaction,
      );

      const ratings = await aggregateFreelancerRatings(order.freelancer_id, transaction);
      const successRate = calculateSuccessRate(ratings.sum, ratings.count);
      const updatedProfile = await updateFreelancerSuccessRate(
        freelancerProfile.id,
        successRate,
        transaction,
      );

      return mapReview(review, updatedProfile.success_rate.toString());
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (isPrismaKnownError(error, 'P2002')) {
      throw new ApiError(409, 'REVIEW_ALREADY_EXISTS', 'You have already reviewed this order.');
    }

    if (isPrismaKnownError(error, 'P2034')) {
      throw new ApiError(409, 'REVIEW_RETRY_REQUIRED', 'The review changed while it was being submitted. Please retry.');
    }

    throw error;
  }
}
