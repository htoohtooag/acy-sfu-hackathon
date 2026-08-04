import {
  createOrderSchema,
  orderIdSchema,
  orderListQuerySchema,
  paymentProofFieldsSchema,
} from 'shared/schemas';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validate.js';

export const validateCreateOrder = validateBody(createOrderSchema);
export const validateOrderParams = validateParams(orderIdSchema);
export const validatePaymentProofFields = validateBody(paymentProofFieldsSchema);
export const validateOrderListQuery = validateQuery(orderListQuerySchema);
