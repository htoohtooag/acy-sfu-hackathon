import type { ReviewResponse } from 'shared/schemas';
import type { Prisma } from '../../../prisma/generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';

export const reviewOrderSelect = {
  id: true,
  client_id: true,
  freelancer_id: true,
  status: true,
} satisfies Prisma.OrderSelect;

export const reviewSelect = {
  id: true,
  order_id: true,
  reviewer_id: true,
  reviewee_id: true,
  rating: true,
  comment: true,
  created_at: true,
} satisfies Prisma.ReviewSelect;

export const freelancerProfileSelect = {
  id: true,
  user_id: true,
  success_rate: true,
} satisfies Prisma.FreelancerProfileSelect;

export type ReviewOrderRecord = Prisma.OrderGetPayload<{
  select: typeof reviewOrderSelect;
}>;

export type ReviewRecord = Prisma.ReviewGetPayload<{
  select: typeof reviewSelect;
}>;

export type FreelancerProfileRecord = Prisma.FreelancerProfileGetPayload<{
  select: typeof freelancerProfileSelect;
}>;

export type ReviewDatabaseClient = typeof prisma | Prisma.TransactionClient;
export type ReviewTransactionClient = Prisma.TransactionClient;

export function mapReview(review: ReviewRecord, successRate: string): ReviewResponse {
  return {
    review_id: review.id,
    order_id: review.order_id,
    reviewer_id: review.reviewer_id,
    reviewee_id: review.reviewee_id,
    rating: review.rating,
    comment: review.comment,
    success_rate: successRate,
    created_at: review.created_at.toISOString(),
  };
}
