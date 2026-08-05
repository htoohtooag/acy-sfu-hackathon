import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { listExperienceLevels } from './lookup.controller.js';

export const lookupRouter = Router();

lookupRouter.get('/experience-levels', requireAuth, listExperienceLevels);
