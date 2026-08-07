import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './notification.controller.js';
import {
  validateNotificationId,
  validateNotificationListQuery,
  validateNotificationMarkAllRead,
} from './notification.validator.js';

export const notificationRouter = Router();

notificationRouter.get(
  '/',
  requireAuth,
  validateNotificationListQuery,
  listNotifications,
);

notificationRouter.post(
  '/mark-all-read',
  requireAuth,
  validateNotificationMarkAllRead,
  markAllNotificationsRead,
);

notificationRouter.patch(
  '/:id',
  requireAuth,
  validateNotificationId,
  markNotificationRead,
);
