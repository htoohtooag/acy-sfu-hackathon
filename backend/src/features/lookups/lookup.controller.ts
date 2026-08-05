import type { RequestHandler } from 'express';
import { successResponse } from '../../utils/api-response.js';
import { getActiveExperienceLevels } from './lookup.service.js';

export const listExperienceLevels: RequestHandler = async (_request, response, next): Promise<void> => {
  try {
    const levels = await getActiveExperienceLevels();
    response.status(200).json(successResponse(levels));
  } catch (error: unknown) {
    next(error);
  }
};
