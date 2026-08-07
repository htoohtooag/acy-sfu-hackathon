import type { NotificationResponse } from 'shared/schemas';

export type NotificationEmitter = (
  userId: string,
  payload: NotificationResponse,
) => void;

let notificationEmitter: NotificationEmitter | undefined;

export function userRoomName(userId: string): string {
  return `user:${userId}`;
}

export function configureNotificationEmitter(emitter: NotificationEmitter): void {
  notificationEmitter = emitter;
}

export function emitNotification(userId: string, payload: NotificationResponse): void {
  if (notificationEmitter === undefined) {
    throw new Error('Notification emitter is not configured.');
  }

  notificationEmitter(userId, payload);
}
