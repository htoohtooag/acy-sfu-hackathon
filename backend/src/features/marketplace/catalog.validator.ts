import type { RequestHandler } from 'express';
import {
  createJobPostSchema,
  createPackageSchema,
  jobPostListQuerySchema,
  packageListQuerySchema,
  updateJobPostSchema,
  updatePackageSchema,
} from 'shared/schemas';
import { validateBody, validateQuery } from '../../middlewares/validate.js';

export const validateCreatePackage: RequestHandler = validateBody(createPackageSchema);
export const validateUpdatePackage: RequestHandler = validateBody(updatePackageSchema);
export const validatePackageQuery: RequestHandler = validateQuery(packageListQuerySchema);
export const validateCreateJob: RequestHandler = validateBody(createJobPostSchema);
export const validateUpdateJob: RequestHandler = validateBody(updateJobPostSchema);
export const validateJobQuery: RequestHandler = validateQuery(jobPostListQuerySchema);
