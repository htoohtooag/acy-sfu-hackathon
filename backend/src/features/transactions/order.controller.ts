import type { RequestHandler } from 'express';
import { createOrderSchema, orderIdSchema, orderListQuerySchema } from 'shared/schemas';
import { ApiError } from '../../utils/api-error.js';
import { successResponse } from '../../utils/api-response.js';
import {
  createMarketplaceOrder,
  getMarketplaceOrder,
  listMarketplaceOrders,
} from './order.service.js';

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

export const listOrders: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    response.status(200).json(successResponse(await listMarketplaceOrders(
      userIdOrThrow(request),
      orderListQuerySchema.parse(request.query),
    )));
  } catch (error: unknown) {
    next(error);
  }
};

export const getOrder: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const { id } = orderIdSchema.parse({ id: request.params.id });
    response.status(200).json(successResponse(await getMarketplaceOrder(userIdOrThrow(request), id)));
  } catch (error: unknown) {
    next(error);
  }
};
