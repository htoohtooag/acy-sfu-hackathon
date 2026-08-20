import { Router } from 'express';
import { dashboardQuerySchema } from 'shared/schemas';
import { requireAuth } from '../../middlewares/auth.js';
import { validateQuery } from '../../middlewares/validate.js';
import { getDashboard } from './dashboard.controller.js';

export const dashboardRouter = Router();
dashboardRouter.get('/', requireAuth, validateQuery(dashboardQuerySchema), getDashboard);
