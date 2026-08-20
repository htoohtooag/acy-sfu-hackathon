import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireAdminRole } from './admin.middleware.js';
import { getAdminProfile, getPendingPayment, listPendingPayments, moderate, verifyPayment } from './admin.controller.js';
import {
  validateModerationBody,
  validateModerationParams,
  validatePaymentParams,
  validatePaymentDecision,
} from './admin.validator.js';

export const adminRouter = Router();

adminRouter.get(
  '/me',
  requireAuth,
  requireAdminRole('SUPER_ADMIN', 'FINANCE_ADMIN'),
  getAdminProfile,
);

adminRouter.get(
  '/payments',
  requireAuth,
  requireAdminRole('SUPER_ADMIN', 'FINANCE_ADMIN'),
  listPendingPayments,
);

adminRouter.get(
  '/payments/:id',
  requireAuth,
  requireAdminRole('SUPER_ADMIN', 'FINANCE_ADMIN'),
  validatePaymentParams,
  getPendingPayment,
);

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
