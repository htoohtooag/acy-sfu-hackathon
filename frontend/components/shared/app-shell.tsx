"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useCurrentUser, useRecentWorkrooms } from "@/features/app/app-api";
import { useAppStore } from "@/store/use-app-store";
import { AppMobileHeader } from "./app-mobile-header";
import { AppSidebar } from "./app-sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const { data: user, isPending: userPending, isError: userError } = useCurrentUser();
  const { data: recentWorkrooms = [] } = useRecentWorkrooms();
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const activeRole = useAppStore((state) => state.activeRole);
  const setActiveRole = useAppStore((state) => state.setActiveRole);

  useEffect(() => {
    if (user && !user.roles.includes(activeRole)) setActiveRole(user.roles[0] ?? "CLIENT");
  }, [activeRole, setActiveRole, user]);

  if (userPending) return <div className="flex min-h-screen items-center justify-center bg-background p-6 text-sm text-muted-foreground" role="status">Loading your workspace…</div>;
  if (userError || !user) return <div className="flex min-h-screen items-center justify-center bg-background p-6 text-sm text-destructive" role="alert">Your workspace could not be loaded. Refresh and try again.</div>;

  return <div className="flex min-h-screen overflow-hidden bg-background"><div className="hidden h-screen lg:flex"><AppSidebar user={user} recentWorkrooms={recentWorkrooms} /></div><Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}><SheetContent className="left-0 right-auto max-w-sm data-ending-style:-translate-x-full data-starting-style:-translate-x-full"><SheetTitle className="sr-only">Workspace navigation</SheetTitle><AppSidebar user={user} recentWorkrooms={recentWorkrooms} mobile /></SheetContent></Sheet><div className="flex min-w-0 flex-1 flex-col"><AppMobileHeader /><main className="min-h-0 flex-1 overflow-y-auto">{children}</main></div></div>;
}
