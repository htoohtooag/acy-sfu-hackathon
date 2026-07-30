import type { RequestHandler } from 'express';
import { createOrderSchema } from 'shared/schemas';
import { ApiError } from '../../utils/api-error.js';
import { successResponse } from '../../utils/api-response.js';
import { createMarketplaceOrder } from './order.service.js';

function userIdOrThrow(request: Parameters<RequestHandler>[0]): string {
  if (request.user === undefined) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.');
  }

  return request.user.id;
}

export const createOrder: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const result = await createMarketplaceOrder(
      userIdOrThrow(request),
      createOrderSchema.parse(request.body),
    );
    response.status(201).json(successResponse(result));
  } catch (error: unknown) {
    next(error);
  }
};
