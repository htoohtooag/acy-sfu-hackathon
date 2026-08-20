import type { RequestHandler } from 'express';
import { dashboardQuerySchema } from 'shared/schemas';
import { ApiError } from '../../utils/api-error.js';
import { successResponse } from '../../utils/api-response.js';
import { getDashboardSummary } from './dashboard.service.js';

export const getDashboard: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    if (request.user === undefined) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.');
    const { role } = dashboardQuerySchema.parse(request.query);
    response.status(200).json(successResponse(await getDashboardSummary(request.user.id, role, request.user.roles)));
  } catch (error: unknown) {
    next(error);
  }
};
