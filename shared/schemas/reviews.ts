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
