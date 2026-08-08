import type { RequestHandler } from 'express';
import {
  deliverableDecisionParamsSchema,
  deliverableDecisionSchema,
  deliverableOrderParamsSchema,
} from 'shared/schemas';
import { ApiError } from '../../utils/api-error.js';
import { successResponse } from '../../utils/api-response.js';
import {
  approveOrRejectDeliverable,
  getCleanDeliverableDownload,
  getWatermarkedDeliverablePreview,
  submitDeliverable,
} from './deliverable.service.js';

function authenticatedUserId(request: Parameters<RequestHandler>[0]): string {
  if (request.user === undefined) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.');
  }

  return request.user.id;
}

export const submit: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const { id: orderId } = deliverableOrderParamsSchema.parse({ id: request.params.id });
    if (request.file === undefined) {
      throw new ApiError(422, 'DELIVERABLE_REQUIRED', 'A deliverable image is required.');
    }

    const result = await submitDeliverable(
      authenticatedUserId(request),
      orderId,
      request.file,
    );
    response.status(201).json(successResponse(result));
  } catch (error: unknown) {
    next(error);
  }
};

export const decide: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const params = deliverableDecisionParamsSchema.parse({
      id: request.params.id,
      deliverableId: request.params.deliverableId,
    });
    const decision = deliverableDecisionSchema.parse(request.body);
    const result = await approveOrRejectDeliverable(
      authenticatedUserId(request),
      params.id,
      params.deliverableId,
      decision,
    );
    response.status(200).json(successResponse(result));
  } catch (error: unknown) {
    next(error);
  }
};

export const preview: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const params = deliverableDecisionParamsSchema.parse({
      id: request.params.id,
      deliverableId: request.params.deliverableId,
    });
    const result = await getWatermarkedDeliverablePreview(
      authenticatedUserId(request),
      params.id,
      params.deliverableId,
    );
    response.status(200).json(successResponse(result));
  } catch (error: unknown) {
    next(error);
  }
};

export const download: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const params = deliverableDecisionParamsSchema.parse({
      id: request.params.id,
      deliverableId: request.params.deliverableId,
    });
    const result = await getCleanDeliverableDownload(
      authenticatedUserId(request),
      params.id,
      params.deliverableId,
    );
    response.status(200).json(successResponse(result));
  } catch (error: unknown) {
    next(error);
  }
};
