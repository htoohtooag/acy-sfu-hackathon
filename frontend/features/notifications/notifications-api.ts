"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  notificationListResponseSchema,
  notificationMarkAllReadResponseSchema,
  notificationResponseSchema,
  type NotificationListResponse,
  type NotificationMarkAllReadResponse,
  type NotificationResponse,
} from "shared/schemas";

import { authenticatedApiRequest } from "@/lib/api-client";
import type { NotificationPageFilter } from "./notifications-types";

function parseNotificationList(value: unknown): NotificationListResponse {
  const parsed = notificationListResponseSchema.safeParse(value);
  if (!parsed.success) throw new Error("The notifications response was not valid.");
  return parsed.data;
}

function parseNotification(value: unknown): NotificationResponse {
  const parsed = notificationResponseSchema.safeParse(value);
  if (!parsed.success) throw new Error("The notification response was not valid.");
  return parsed.data;
}

async function getNotifications(category: NotificationPageFilter, pageSize = 20, signal?: AbortSignal): Promise<NotificationListResponse> {
  const params = new URLSearchParams({ page: "1", page_size: String(pageSize) });
  if (category !== "ALL") params.set("category", category);
  const data: unknown = await authenticatedApiRequest<unknown>(`/api/v1/notifications?${params.toString()}`, { signal });
  return parseNotificationList(data);
}

async function getUnreadNotificationCount(signal?: AbortSignal): Promise<number> {
  const params = new URLSearchParams({ unreadOnly: "true", page: "1", page_size: "50" });
  const data: unknown = await authenticatedApiRequest<unknown>(`/api/v1/notifications?${params.toString()}`, { signal });
  return parseNotificationList(data).total_items;
}

async function markNotificationAsRead(notificationId: string): Promise<NotificationResponse> {
  const data: unknown = await authenticatedApiRequest<unknown>(`/api/v1/notifications/${encodeURIComponent(notificationId)}`, { method: "PATCH" });
  return parseNotification(data);
}

async function markAllNotificationsAsRead(): Promise<NotificationMarkAllReadResponse> {
  const data: unknown = await authenticatedApiRequest<unknown>("/api/v1/notifications/mark-all-read", { method: "POST", body: JSON.stringify({}) });
  const parsed = notificationMarkAllReadResponseSchema.safeParse(data);
  if (!parsed.success) throw new Error("The mark all notifications response was not valid.");
  return parsed.data;
}

export const notificationsQueryOptions = (category: NotificationPageFilter, pageSize = 20) => queryOptions({
  queryKey: ["notifications", category, pageSize] as const,
  queryFn: ({ signal }) => getNotifications(category, pageSize, signal),
});

export const unreadNotificationCountQueryOptions = queryOptions({
  queryKey: ["unreadCount"] as const,
  queryFn: ({ signal }) => getUnreadNotificationCount(signal),
});

export function useNotifications(category: NotificationPageFilter, pageSize = 20) {
  return useQuery(notificationsQueryOptions(category, pageSize));
}

export function useUnreadNotificationCount() {
  return useQuery(unreadNotificationCountQueryOptions);
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
}
