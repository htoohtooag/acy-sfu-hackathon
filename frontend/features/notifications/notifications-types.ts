import {
  notificationCategorySchema,
  notificationMetadataWithLinkSchema,
  type NotificationCategory,
  type NotificationListResponse,
  type NotificationMarkAllReadResponse,
  type NotificationResponse,
} from "shared/schemas";

export type NotificationPageFilter = "ALL" | NotificationCategory;

export type NotificationTab = {
  value: NotificationPageFilter;
  label: string;
};

export const notificationTabs: readonly NotificationTab[] = [
  { value: "ALL", label: "All" },
  { value: "ORDERS_ESCROW", label: "Orders & Escrow" },
  { value: "OFFERS_PROPOSALS", label: "Offers" },
  { value: "SYSTEM_ACCOUNT", label: "System" },
];

export function isNotificationCategory(value: string | null): value is NotificationCategory {
  return notificationCategorySchema.safeParse(value).success;
}

export function getNotificationLink(notification: NotificationResponse): string | null {
  const parsed = notificationMetadataWithLinkSchema.safeParse(notification.metadata);
  return parsed.success ? parsed.data.link : null;
}

export function getNotificationCategoryLabel(category: NotificationCategory): string {
  switch (category) {
    case "ORDERS_ESCROW":
      return "Orders & Escrow";
    case "OFFERS_PROPOSALS":
      return "Offers";
    case "SYSTEM_ACCOUNT":
      return "System";
  }
}

export type {
  NotificationCategory,
  NotificationListResponse,
  NotificationMarkAllReadResponse,
  NotificationResponse,
};
