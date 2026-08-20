"use client";

import { BellRing, CheckCheck, ChevronRight, Inbox, Sparkles } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsIndicator, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from "@/features/notifications/notifications-api";
import {
  getNotificationCategoryLabel,
  getNotificationLink,
  isNotificationCategory,
  notificationTabs,
  type NotificationPageFilter,
  type NotificationResponse,
} from "@/features/notifications/notifications-types";
import { cn } from "@/lib/utils";

function getSelectedCategory(value: string | null): NotificationPageFilter {
  return isNotificationCategory(value) ? value : "ALL";
}

function formatNotificationDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.length > 0 ? error.message : fallback;
}

export function NotificationsPage(): ReactNode {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = getSelectedCategory(searchParams.get("category"));
  const notificationsQuery = useNotifications(selectedCategory);
  const markAllMutation = useMarkAllNotificationsAsRead();
  const markReadMutation = useMarkNotificationAsRead();
  const notifications = notificationsQuery.data?.items ?? [];
  const hasUnread = notifications.some((notification) => !notification.is_read);

  function handleCategoryChange(value: unknown): void {
    if (typeof value !== "string") return;
    const nextCategory = getSelectedCategory(value === "ALL" ? null : value);
    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextCategory === "ALL") nextParams.delete("category");
    else nextParams.set("category", nextCategory);
    const query = nextParams.toString();
    router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  async function handleMarkAll(): Promise<void> {
    try {
      await markAllMutation.mutateAsync();
      toast.success("All notifications are marked as read.");
    } catch (error: unknown) {
      toast.error("Notifications could not be updated.", { description: getErrorMessage(error, "Try again in a moment.") });
    }
  }

  async function handleNotificationClick(notification: NotificationResponse): Promise<void> {
    if (markReadMutation.isPending && markReadMutation.variables === notification.id) return;

    if (!notification.is_read) {
      try {
        await markReadMutation.mutateAsync(notification.id);
      } catch (error: unknown) {
        toast.error("Notification could not be opened.", { description: getErrorMessage(error, "Try again in a moment.") });
        return;
      }
    }

    const link = getNotificationLink(notification);
    if (link) {
      router.push(link);
      return;
    }
    toast.info("This notification has no destination yet.");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-5 sm:p-8 lg:p-10">
      <header className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><Sparkles aria-hidden="true" />Workspace signal</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Notifications</h1>
            <p className="max-w-[52ch] text-base leading-7 text-muted-foreground">A clear record of the moments that move your work forward.</p>
          </div>
          <Button type="button" variant="ghost" className="self-start sm:self-auto" disabled={markAllMutation.isPending || !hasUnread} onClick={() => { void handleMarkAll(); }}>
            <CheckCheck data-icon="inline-start" />
            {markAllMutation.isPending ? "Marking as read…" : "Mark all as read"}
          </Button>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground" aria-live="polite">
          <span className="inline-flex size-2 rounded-full bg-primary" aria-hidden="true" />
          <span>{notificationsQuery.isFetching && !notificationsQuery.isPending ? "Refreshing your signal…" : "Your latest account and order activity"}</span>
        </div>
      </header>

      <section className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-3 shadow-sm sm:p-5" aria-labelledby="notification-list-heading">
        <h2 id="notification-list-heading" className="sr-only">Notification list</h2>
        <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="border-b border-border px-1">
          <TabsList className="w-full overflow-x-auto">
            {notificationTabs.map((tab) => <TabsTrigger key={tab.value} value={tab.value} className="min-w-24 whitespace-nowrap sm:min-w-32">{tab.label}</TabsTrigger>)}
            <TabsIndicator className="hidden sm:block" />
          </TabsList>
        </Tabs>

        {notificationsQuery.isPending ? <NotificationRowsSkeleton /> : notificationsQuery.isError ? (
          <Alert variant="destructive" className="m-2">
            <BellRing aria-hidden="true" />
            <AlertTitle>Notifications could not be loaded.</AlertTitle>
            <AlertDescription>{getErrorMessage(notificationsQuery.error, "Refresh the page and try again.")}</AlertDescription>
          </Alert>
        ) : notifications.length === 0 ? (
          <Empty className="min-h-72 rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon"><Inbox aria-hidden="true" /></EmptyMedia>
              <EmptyTitle>{selectedCategory === "ALL" ? "You are all caught up" : `No ${getNotificationCategoryLabel(selectedCategory).toLowerCase()} notifications`}</EmptyTitle>
              <EmptyDescription>{selectedCategory === "ALL" ? "New order and account updates will appear here." : "Try another notification category to see more activity."}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="flex flex-col gap-2" aria-label="Notifications" aria-live="polite">
            {notifications.map((notification) => <NotificationRow key={notification.id} notification={notification} pending={markReadMutation.isPending && markReadMutation.variables === notification.id} onClick={handleNotificationClick} />)}
          </ul>
        )}
      </section>
    </div>
  );
}

function NotificationRowsSkeleton(): ReactNode {
  return <div className="flex flex-col gap-2" role="status" aria-label="Loading notifications">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 w-full rounded-2xl" />)}</div>;
}

function NotificationRow({ notification, pending, onClick }: { notification: NotificationResponse; pending: boolean; onClick: (notification: NotificationResponse) => Promise<void> }): ReactNode {
  return (
    <li>
      <button
        type="button"
        className={cn(
          "flex min-h-24 w-full items-start gap-4 rounded-2xl border border-transparent p-4 text-start transition-colors hover:border-border hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-5",
          !notification.is_read && "border-primary/20 bg-muted/50",
          pending && "cursor-wait opacity-70",
        )}
        aria-label={`${notification.is_read ? "Read" : "Unread"} notification: ${notification.title}`}
        aria-busy={pending}
        disabled={pending}
        onClick={() => { void onClick(notification); }}
      >
        <span className={cn("mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground", !notification.is_read && "bg-primary/10 text-primary")} aria-hidden="true"><BellRing /></span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <span className={cn("min-w-0 truncate text-base", !notification.is_read && "font-semibold")}>{notification.title}</span>
            <time className="shrink-0 text-xs text-muted-foreground" dateTime={notification.created_at}>{formatNotificationDate(notification.created_at)}</time>
          </span>
          {notification.body ? <span className="mt-2 block text-sm leading-6 text-muted-foreground">{notification.body}</span> : null}
          <span className="mt-3 flex flex-wrap items-center gap-2">
            <Badge className={cn("px-2 py-1", !notification.is_read && "border-primary/20 bg-primary/10 text-primary")}>{getNotificationCategoryLabel(notification.category)}</Badge>
            {!notification.is_read ? <span className="text-xs font-medium text-primary"><span className="sr-only">Unread notification</span>New</span> : null}
          </span>
        </span>
        <ChevronRight className="mt-1 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
    </li>
  );
}
