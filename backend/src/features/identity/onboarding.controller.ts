import type { RequestHandler } from 'express';
import { onboardingRequestSchema } from 'shared/schemas';
import { completeOnboarding } from './onboarding.service.js';
import { successResponse } from '../../utils/api-response.js';
import { ApiError } from '../../utils/api-error.js';

export const createOnboarding: RequestHandler = async (request, response, next): Promise<void> => {
  if (request.user === undefined) {
    next(new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.'));
    return;
  }

  try {
    const payload = onboardingRequestSchema.parse(request.body);
    const result = await completeOnboarding({
      userId: request.user.id,
      payload,
    });

    response.status(200).json(successResponse(result));
  } catch (error: unknown) {
    next(error);
  }
};
