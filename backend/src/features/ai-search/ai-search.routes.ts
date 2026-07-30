import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { aiSearchRateLimit } from './ai-search.rate-limit.js';
import { searchWithAi } from './ai-search.controller.js';
import { validateAiSearchRequest } from './ai-search.validator.js';

export const aiSearchRouter = Router();

aiSearchRouter.post(
  '/search',
  requireAuth,
  requireRole('CLIENT'),
  aiSearchRateLimit,
  validateAiSearchRequest,
  searchWithAi,
);
