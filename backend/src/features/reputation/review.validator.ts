import { createReviewSchema, reviewOrderParamsSchema } from 'shared/schemas';
import { validateBody, validateParams } from '../../middlewares/validate.js';

export const validateReviewOrderParams = validateParams(reviewOrderParamsSchema);
export const validateCreateReview = validateBody(createReviewSchema);
