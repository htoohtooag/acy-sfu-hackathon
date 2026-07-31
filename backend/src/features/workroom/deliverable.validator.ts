import {
  deliverableDecisionParamsSchema,
  deliverableDecisionSchema,
  deliverableOrderParamsSchema,
} from 'shared/schemas';
import { validateBody, validateParams } from '../../middlewares/validate.js';

export const validateDeliverableOrderParams = validateParams(deliverableOrderParamsSchema);
export const validateDeliverableDecisionParams = validateParams(deliverableDecisionParamsSchema);
export const validateDeliverableDecision = validateBody(deliverableDecisionSchema);
