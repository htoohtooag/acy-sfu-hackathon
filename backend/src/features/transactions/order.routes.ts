import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { paymentProofUpload } from '../../middlewares/upload.js';
import { createOrder, getOrder, listOrders, quoteOrder } from './order.controller.js';
import { createPayment } from './payment.controller.js';
import {
  validateCreateOrder,
  validateOrderParams,
  validatePaymentProofFields,
  validateOrderListQuery,
  validateOrderQuote,
} from './order.validator.js';

export const orderRouter = Router();

orderRouter.get('/', requireAuth, validateOrderListQuery, listOrders);
orderRouter.post(
  '/quote',
  requireAuth,
  requireRole('CLIENT'),
  validateOrderQuote,
  quoteOrder,
);
orderRouter.get('/:id', requireAuth, validateOrderParams, getOrder);

orderRouter.post(
  '/',
  requireAuth,
  requireRole('CLIENT'),
  validateCreateOrder,
  createOrder,
);

orderRouter.post(
  '/:id/payments',
  requireAuth,
  requireRole('CLIENT'),
  validateOrderParams,
  paymentProofUpload,
  validatePaymentProofFields,
  createPayment,
);
