"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";

export function AppMobileHeader() {
  const pathname = usePathname();
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const label = pathname === "/dashboard" ? "Home" : pathname.split("/")[1]?.replaceAll("-", " ") ?? "Workspace";

  return <header className="flex h-16 items-center gap-3 border-b border-border bg-background px-4 lg:hidden"><Button type="button" variant="ghost" size="icon" aria-label="Open workspace navigation" onClick={() => setSidebarOpen(true)}><Menu aria-hidden="true" /></Button><span className="font-heading text-lg font-semibold capitalize">{label}</span></header>;
}
