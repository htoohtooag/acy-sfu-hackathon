import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { listExperienceLevels, listPackageTiers } from './lookup.controller.js';

export const lookupRouter = Router();

lookupRouter.get('/experience-levels', requireAuth, listExperienceLevels);
lookupRouter.get('/package-tiers', requireAuth, listPackageTiers);
