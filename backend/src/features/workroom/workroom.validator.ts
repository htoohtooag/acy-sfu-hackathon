import {
  joinRoomSchema,
  sendMessageSchema,
  workroomHistoryQuerySchema,
  workroomOrderIdSchema,
} from 'shared/schemas';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validate.js';

export const validateWorkroomOrderParams = validateParams(workroomOrderIdSchema);
export const validateWorkroomHistoryQuery = validateQuery(workroomHistoryQuerySchema);
export const validateJoinRoomPayload = joinRoomSchema;
export const validateSendMessagePayload = sendMessageSchema;
