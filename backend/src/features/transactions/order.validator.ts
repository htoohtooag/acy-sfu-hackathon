import { createOrderSchema, orderIdSchema, paymentProofFieldsSchema } from 'shared/schemas';
import { validateBody, validateParams } from '../../middlewares/validate.js';

export const validateCreateOrder = validateBody(createOrderSchema);
export const validateOrderParams = validateParams(orderIdSchema);
export const validatePaymentProofFields = validateBody(paymentProofFieldsSchema);
