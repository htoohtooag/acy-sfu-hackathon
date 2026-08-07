import {
  notificationIdSchema,
  notificationListQuerySchema,
  notificationMarkAllReadSchema,
} from 'shared/schemas';
import { validateBody, validateParams, validateQuery } from '../../middlewares/validate.js';

export const validateNotificationId = validateParams(notificationIdSchema);
export const validateNotificationListQuery = validateQuery(notificationListQuerySchema);
export const validateNotificationMarkAllRead = validateBody(notificationMarkAllReadSchema);
