import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireAdminRole } from './admin.middleware.js';
import { moderate, verifyPayment } from './admin.controller.js';
import {
  validateModerationBody,
  validateModerationParams,
  validatePaymentParams,
  validatePaymentDecision,
} from './admin.validator.js';

export const adminRouter = Router();

adminRouter.patch(
  '/payments/:id',
  requireAuth,
  requireAdminRole('SUPER_ADMIN', 'FINANCE_ADMIN'),
  validatePaymentParams,
  validatePaymentDecision,
  verifyPayment,
);

adminRouter.post(
  '/users/:id/moderations',
  requireAuth,
  requireAdminRole('SUPER_ADMIN', 'MODERATION_ADMIN'),
  validateModerationParams,
  validateModerationBody,
  moderate,
);
