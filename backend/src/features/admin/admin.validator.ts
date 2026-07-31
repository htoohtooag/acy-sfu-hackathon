import {
  adminPaymentIdSchema,
  moderationRequestSchema,
  moderationTargetIdSchema,
  paymentDecisionSchema,
} from 'shared/schemas';
import { validateBody, validateParams } from '../../middlewares/validate.js';

export const validatePaymentParams = validateParams(adminPaymentIdSchema);
export const validateModerationParams = validateParams(moderationTargetIdSchema);
export const validatePaymentDecision = validateBody(paymentDecisionSchema);
export const validateModerationBody = validateBody(moderationRequestSchema);
