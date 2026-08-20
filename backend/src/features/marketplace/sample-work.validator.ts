import type { RequestHandler } from 'express';
import { sampleWorkIdSchema } from 'shared/schemas';
import { ApiError } from '../../utils/api-error.js';

export const validateSampleWorkId: RequestHandler = (request, _response, next): void => {
  try {
    sampleWorkIdSchema.parse({ sampleId: request.params.sampleId });
    next();
  } catch {
    next(new ApiError(400, 'VALIDATION_ERROR', 'The sample work ID is invalid.'));
  }
};
