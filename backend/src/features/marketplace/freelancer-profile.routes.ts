import { Router } from 'express';
import { validateParams } from '../../middlewares/validate.js';
import { freelancerProfileIdSchema } from 'shared/schemas';
import { getFreelancerProfile } from './freelancer-profile.controller.js';

export const freelancerProfileRouter = Router();

freelancerProfileRouter.get('/:id', validateParams(freelancerProfileIdSchema), getFreelancerProfile);
