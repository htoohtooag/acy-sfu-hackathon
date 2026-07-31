import type { RequestHandler } from 'express';
import { workroomHistoryQuerySchema, workroomOrderIdSchema } from 'shared/schemas';
import { ApiError } from '../../utils/api-error.js';
import { successResponse } from '../../utils/api-response.js';
import { getOrderMessages } from './workroom.service.js';

function authenticatedUserId(request: Parameters<RequestHandler>[0]): string {
  if (request.user === undefined) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.');
  }

  return request.user.id;
}

export const getMessages: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const { id: orderId } = workroomOrderIdSchema.parse({ id: request.params.id });
    const query = workroomHistoryQuerySchema.parse(request.query);
    const result = await getOrderMessages(
      authenticatedUserId(request),
      orderId,
      query.page,
      query.page_size,
    );

    response.status(200).json(successResponse(result));
  } catch (error: unknown) {
    next(error);
  }
};
