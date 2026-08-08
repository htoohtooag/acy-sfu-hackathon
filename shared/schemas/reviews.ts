import { z } from 'zod';

export const reviewOrderParamsSchema = z
  .object({ id: z.uuid() })
  .strict();

export const createReviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional(),
  })
  .strict();

export const reviewResponseSchema = z
  .object({
    review_id: z.uuid(),
    order_id: z.uuid(),
    reviewer_id: z.uuid(),
    reviewee_id: z.uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().nullable(),
    success_rate: z.string(),
    created_at: z.iso.datetime({ offset: true }),
  })
  .strict();

export const reviewStatusResponseSchema = z
  .object({
    reviewed: z.boolean(),
  })
  .strict();

export type CreateReviewRequest = z.infer<typeof createReviewSchema>;

export type ReviewResponse = {
  review_id: string;
  order_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  success_rate: string;
  created_at: string;
};

export type ReviewStatusResponse = {
  reviewed: boolean;
};
