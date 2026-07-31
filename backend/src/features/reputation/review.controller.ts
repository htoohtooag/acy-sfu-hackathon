import type { RequestHandler } from 'express';
import { createReviewSchema, reviewOrderParamsSchema } from 'shared/schemas';
import { ApiError } from '../../utils/api-error.js';
import { successResponse } from '../../utils/api-response.js';
import { createClientReview } from './review.service.js';

function authenticatedUserId(request: Parameters<RequestHandler>[0]): string {
  if (request.user === undefined) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.');
  }

  return request.user.id;
}

export const createReview: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const { id: orderId } = reviewOrderParamsSchema.parse({ id: request.params.id });
    const fields = createReviewSchema.parse(request.body);
    const result = await createClientReview(authenticatedUserId(request), orderId, fields);

    response.status(201).json(successResponse(result));
  } catch (error: unknown) {
    next(error);
  }
};
