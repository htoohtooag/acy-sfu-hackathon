import type { RequestHandler } from 'express';
import { freelancerProfileIdSchema } from 'shared/schemas';
import { successResponse } from '../../utils/api-response.js';
import { getPublicFreelancerProfile } from './freelancer-profile.service.js';

export const getFreelancerProfile: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    console.log("i ma run")
    const { id } = freelancerProfileIdSchema.parse({ id: request.params.id });
    console.log(id);
    response.status(200).json(successResponse(await getPublicFreelancerProfile(id)));
  } catch (error: unknown) {
    next(error);
  }
};
