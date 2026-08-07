import type { RequestHandler } from 'express';
import {
  notificationIdSchema,
  notificationListQuerySchema,
  notificationMarkAllReadSchema,
} from 'shared/schemas';
import { ApiError } from '../../utils/api-error.js';
import { successResponse } from '../../utils/api-response.js';
import {
  listUserNotifications,
  markAllUserNotificationsRead,
  markUserNotificationRead,
} from './notification.service.js';

function authenticatedUserId(request: Parameters<RequestHandler>[0]): string {
  if (request.user === undefined) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.');
  }

  return request.user.id;
}

export const listNotifications: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const query = notificationListQuerySchema.parse(request.query);
    const result = await listUserNotifications(authenticatedUserId(request), query);
    response.status(200).json(successResponse(result));
  } catch (error: unknown) {
    next(error);
  }
};

export const markNotificationRead: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const { id } = notificationIdSchema.parse({ id: request.params.id });
    const result = await markUserNotificationRead(authenticatedUserId(request), id);
    response.status(200).json(successResponse(result));
  } catch (error: unknown) {
    next(error);
  }
};

export const markAllNotificationsRead: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    notificationMarkAllReadSchema.parse(request.body);
    const result = await markAllUserNotificationsRead(authenticatedUserId(request));
    response.status(200).json(successResponse(result));
  } catch (error: unknown) {
    next(error);
  }
};
