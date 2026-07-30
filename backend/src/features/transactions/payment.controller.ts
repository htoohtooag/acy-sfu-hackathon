import type { RequestHandler } from 'express';
import { orderIdSchema, paymentProofFieldsSchema } from 'shared/schemas';
import { ApiError } from '../../utils/api-error.js';
import { successResponse } from '../../utils/api-response.js';
import { createPaymentProof } from './payment.service.js';

function userIdOrThrow(request: Parameters<RequestHandler>[0]): string {
  if (request.user === undefined) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.');
  }

  return request.user.id;
}

function orderIdOrThrow(request: Parameters<RequestHandler>[0]): string {
  return orderIdSchema.parse({ id: request.params.id }).id;
}

export const createPayment: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    if (request.file === undefined) {
      throw new ApiError(422, 'PAYMENT_PROOF_REQUIRED', 'A payment proof image is required.');
    }

    const result = await createPaymentProof(
      userIdOrThrow(request),
      orderIdOrThrow(request),
      paymentProofFieldsSchema.parse(request.body),
      request.file,
    );
    response.status(201).json(successResponse(result));
  } catch (error: unknown) {
    next(error);
  }
};
