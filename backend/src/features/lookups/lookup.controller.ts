import type { RequestHandler } from 'express';
import { successResponse } from '../../utils/api-response.js';
import { getActiveExperienceLevels, getActivePackageTiers, getActivePaymentMethods } from './lookup.service.js';

export const listExperienceLevels: RequestHandler = async (_request, response, next): Promise<void> => {
  try {
    const levels = await getActiveExperienceLevels();
    response.status(200).json(successResponse(levels));
  } catch (error: unknown) {
    next(error);
  }
};

export const listPackageTiers: RequestHandler = async (_request, response, next): Promise<void> => {
  try {
    const tiers = await getActivePackageTiers();
    response.status(200).json(successResponse(tiers));
  } catch (error: unknown) {
    next(error);
  }
};

export const listPaymentMethods: RequestHandler = async (_request, response, next): Promise<void> => {
  try {
    response.status(200).json(successResponse(await getActivePaymentMethods()));
  } catch (error: unknown) {
    next(error);
  }
};
