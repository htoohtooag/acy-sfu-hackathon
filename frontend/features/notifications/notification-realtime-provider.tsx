"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { notificationResponseSchema } from "shared/schemas";

import { createWorkroomSocket, type WorkroomSocket } from "@/lib/socket";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getNotificationLink } from "./notifications-types";

interface NotificationRealtimeProviderProps {
  children: ReactNode;
}

export function NotificationRealtimeProvider({ children }: NotificationRealtimeProviderProps): ReactNode {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    let disposed = false;
    let socket: WorkroomSocket | null = null;
    const supabase = createSupabaseBrowserClient();

    async function connect(): Promise<void> {
      const { data, error } = await supabase.auth.getSession();
      if (disposed || error || !data.session?.access_token) return;

      socket = createWorkroomSocket(data.session.access_token);
      socket.on("new_notification", (payload) => {
        const parsed = notificationResponseSchema.safeParse(payload.data);
        if (!parsed.success) return;

        const notification = parsed.data;
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        void queryClient.invalidateQueries({ queryKey: ["unreadCount"] });

        const link = getNotificationLink(notification);
        toast(notification.title, {
          description: notification.body ?? undefined,
          action: link
            ? {
                label: "View",
                onClick: () => router.push(link),
              }
            : undefined,
        });
      });
      socket.connect();
    }

    void connect().catch(() => undefined);

    return () => {
      disposed = true;
      socket?.removeAllListeners();
      socket?.disconnect();
    };
  }, [queryClient, router]);

  return children;
}
