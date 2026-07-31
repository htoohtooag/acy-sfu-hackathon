import type { RequestHandler } from 'express';
import {
  adminPaymentIdSchema,
  moderationRequestSchema,
  moderationTargetIdSchema,
  paymentDecisionSchema,
} from 'shared/schemas';
import { ApiError } from '../../utils/api-error.js';
import { successResponse } from '../../utils/api-response.js';
import { moderateUser, rejectEscrowPayment, verifyEscrowPayment } from './admin.service.js';

function userIdOrThrow(request: Parameters<RequestHandler>[0]): string {
  if (request.user === undefined) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.');
  }

  return request.user.id;
}

export const verifyPayment: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const paymentId = adminPaymentIdSchema.parse({ id: request.params.id }).id;
    const decision = paymentDecisionSchema.parse(request.body);
    const result =
      decision.action === 'REJECT'
        ? await rejectEscrowPayment(userIdOrThrow(request), paymentId, decision.reason)
        : await verifyEscrowPayment(userIdOrThrow(request), paymentId);
    response.status(200).json(successResponse(result));
  } catch (error: unknown) {
    next(error);
  }
};

export const moderate: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const targetUserId = moderationTargetIdSchema.parse({ id: request.params.id }).id;
    const result = await moderateUser(
      userIdOrThrow(request),
      targetUserId,
      moderationRequestSchema.parse(request.body),
    );
    response.status(200).json(successResponse(result));
  } catch (error: unknown) {
    next(error);
  }
};
