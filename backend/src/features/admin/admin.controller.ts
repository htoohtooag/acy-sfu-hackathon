import type { RequestHandler } from 'express';
import {
  adminPaymentListQuerySchema,
  adminPaymentIdSchema,
  moderationRequestSchema,
  moderationTargetIdSchema,
  paymentDecisionSchema,
} from 'shared/schemas';
import { ApiError } from '../../utils/api-error.js';
import { successResponse } from '../../utils/api-response.js';
import { getAdminPaymentDetail, getAdminSession, listAdminPendingPayments, moderateUser, rejectEscrowPayment, verifyEscrowPayment } from './admin.service.js';

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

export const getAdminProfile: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    response.status(200).json(successResponse(await getAdminSession(userIdOrThrow(request))));
  } catch (error: unknown) {
    next(error);
  }
};

export const listPendingPayments: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const query = adminPaymentListQuerySchema.parse(request.query);
    response.status(200).json(successResponse(await listAdminPendingPayments(query.page, query.page_size)));
  } catch (error: unknown) {
    next(error);
  }
};

export const getPendingPayment: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const paymentId = adminPaymentIdSchema.parse({ id: request.params.id }).id;
    response.status(200).json(successResponse(await getAdminPaymentDetail(paymentId)));
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
