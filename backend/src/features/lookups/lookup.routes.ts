import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { listExperienceLevels, listPackageTiers, listPaymentMethods } from './lookup.controller.js';

export const lookupRouter = Router();

lookupRouter.get('/experience-levels', requireAuth, listExperienceLevels);
lookupRouter.get('/package-tiers', requireAuth, listPackageTiers);
lookupRouter.get('/payment-methods', requireAuth, listPaymentMethods);
