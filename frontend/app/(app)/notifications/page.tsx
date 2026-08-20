import { Suspense } from "react";

import { NotificationsPage } from "@/components/features/notifications/notifications-page";
import { NotificationsPageSkeleton } from "@/components/features/notifications/notifications-page-skeleton";

export default function NotificationsRoute(): React.ReactNode {
  return <Suspense fallback={<NotificationsPageSkeleton />}><NotificationsPage /></Suspense>;
}
