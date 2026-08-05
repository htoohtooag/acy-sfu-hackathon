"use client";

import { ChevronLeft, ClipboardList, Compass, FileText, Home, MessageSquare, Package, Search, Settings, Sparkles, Bell, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAppStore, type AppRole } from "@/store/use-app-store";
import type { AppUser, RecentWorkroom } from "@/features/app/app-types";
import { AppProfilePopover } from "./app-profile-popover";

type AppSidebarProps = { user: AppUser; recentWorkrooms: RecentWorkroom[]; mobile?: boolean };
type NavItem = { href: string; label: string; icon: LucideIcon };

const generalItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const workItems: Record<AppRole, NavItem[]> = {
  CLIENT: [
    { href: "/find-talent", label: "Find talent", icon: Sparkles },
    { href: "/posts", label: "My job posts", icon: FileText },
    { href: "/orders", label: "My orders", icon: ClipboardList },
  ],
  FREELANCER: [
    { href: "/find-work", label: "Find work", icon: Compass },
    { href: "/posts", label: "My packages", icon: Package },
    { href: "/orders", label: "My orders", icon: ClipboardList },
  ],
};

export function AppSidebar({ user, recentWorkrooms, mobile = false }: AppSidebarProps) {
  const pathname = usePathname();
  const activeRole = useAppStore((state) => state.activeRole);
  const compact = useAppStore((state) => state.sidebarCollapsed) && !mobile;
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const setSidebarCollapsed = useAppStore((state) => state.setSidebarCollapsed);

  function isActive(href: string): boolean {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
  }

  function closeNavigation(): void {
    setSidebarOpen(false);
  }

  function renderItems(items: NavItem[]): ReactNode {
    return items.map((item) => {
      if (compact && item.href === "/messages") return <CollapsedMessages key={item.href} item={item} recentWorkrooms={recentWorkrooms} closeNavigation={closeNavigation} />;
      if (compact && activeRole === "FREELANCER" && item.href === "/posts") return <CollapsedPackages key={item.href} item={item} closeNavigation={closeNavigation} />;
      return <li key={item.href}><NavigationLink item={item} compact={compact} active={isActive(item.href)} closeNavigation={closeNavigation} /></li>;
    });
  }

  return (
    <aside className={cn("flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar px-4 py-5 transition-[width] duration-200", compact ? "w-20" : "w-72", mobile && "w-full border-r-0 px-1 py-1")} aria-label="Workspace navigation">
      <div className={cn("flex items-center pb-5", compact ? "justify-center px-0" : "justify-between px-2")}>
        {!compact ? <Link href="/dashboard" onClick={closeNavigation} className="font-heading text-xl font-bold tracking-tight text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">TalentScout</Link> : <span className="font-heading text-xl font-bold text-primary" aria-label="TalentScout">T</span>}
        {!mobile ? <button type="button" onClick={() => setSidebarCollapsed(!compact)} aria-label={compact ? "Expand navigation" : "Collapse navigation"} className={cn("grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50", compact && "absolute left-14 top-5")}><ChevronLeft className={cn("size-4 transition-transform", compact && "rotate-180")} aria-hidden="true" /></button> : null}
      </div>

      <AppProfilePopover user={user} compact={compact} />

      <nav className="mt-6 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
        <NavGroup label="General" hidden={compact} items={generalItems} renderItems={renderItems} />
        <NavGroup label="Work" hidden={compact} items={workItems[activeRole]} renderItems={renderItems} />
        <NavGroup label="Communication" hidden={compact} items={[{ href: "/messages", label: "Messages", icon: MessageSquare }]} renderItems={renderItems} />
        {!compact ? <RecentMessagesSection recentWorkrooms={recentWorkrooms} closeNavigation={closeNavigation} /> : null}
      </nav>

      <NavigationLink item={{ href: "/settings", label: "Settings", icon: Settings }} compact={compact} active={isActive("/settings")} closeNavigation={closeNavigation} />
    </aside>
  );
}

function NavigationLink({ item, compact, active, closeNavigation }: { item: NavItem; compact: boolean; active: boolean; closeNavigation: () => void }) {
  const link = <Link href={item.href} aria-current={active ? "page" : undefined} aria-label={item.label} onClick={closeNavigation} title={compact ? undefined : item.label} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50", compact && "mx-auto size-11 justify-center px-0", active && "bg-secondary text-secondary-foreground")}><item.icon className="size-4 shrink-0" aria-hidden="true" />{compact ? null : <span>{item.label}</span>}</Link>;
  if (!compact) return link;
  return <Tooltip><TooltipTrigger render={link} /><TooltipContent>{item.label}</TooltipContent></Tooltip>;
}

function CollapsedMessages({ item, recentWorkrooms, closeNavigation }: { item: NavItem; recentWorkrooms: RecentWorkroom[]; closeNavigation: () => void }) {
  return <li><Popover><Tooltip><TooltipTrigger render={<PopoverTrigger aria-label={item.label} className="mx-auto flex size-11 items-center justify-center rounded-lg px-0 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><item.icon className="size-4" aria-hidden="true" /></PopoverTrigger>} /><TooltipContent>{item.label}</TooltipContent></Tooltip><PopoverContent className="w-72"><h2 className="px-2 pb-2 text-sm font-semibold">Recent messages</h2>{recentWorkrooms.length > 0 ? <ul className="space-y-1">{recentWorkrooms.map((room) => <li key={room.id}><Link href={`/messages/${room.id}`} onClick={closeNavigation} className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground" aria-hidden="true">{room.participantName.slice(0, 1).toUpperCase()}</span><span className="min-w-0 truncate">{room.participantName}</span></Link></li>)}</ul> : <p className="px-2 py-2 text-sm text-muted-foreground">Your recent workrooms will appear here.</p>}<Link href="/messages" onClick={closeNavigation} className="mt-2 block border-t border-border px-2 pt-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">View all messages</Link></PopoverContent></Popover></li>;
}

function CollapsedPackages({ item, closeNavigation }: { item: NavItem; closeNavigation: () => void }) {
  return <li><Popover><Tooltip><TooltipTrigger render={<PopoverTrigger aria-label={item.label} className="mx-auto flex size-11 items-center justify-center rounded-lg px-0 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><item.icon className="size-4" aria-hidden="true" /></PopoverTrigger>} /><TooltipContent>{item.label}</TooltipContent></Tooltip><PopoverContent className="w-56"><h2 className="px-2 pb-2 text-sm font-semibold">My packages</h2><Link href="/posts" onClick={closeNavigation} className="flex min-h-10 items-center rounded-lg px-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">Manage packages</Link><Link href="/posts/new" onClick={closeNavigation} className="flex min-h-10 items-center rounded-lg px-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">Create a package</Link></PopoverContent></Popover></li>;
}

function RecentMessagesSection({ recentWorkrooms, closeNavigation }: { recentWorkrooms: RecentWorkroom[]; closeNavigation: () => void }) {
  return <section className="mt-7" aria-labelledby="recent-messages-label"><div className="mb-2 flex items-center justify-between px-3"><h2 id="recent-messages-label" className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Recent messages</h2>{recentWorkrooms.length > 0 ? <Package className="size-3.5 text-primary" aria-hidden="true" /> : null}</div>{recentWorkrooms.length > 0 ? <ul className="space-y-1">{recentWorkrooms.map((room) => <li key={room.id}><Link href={`/messages/${room.id}`} onClick={closeNavigation} className="flex min-h-12 items-center gap-3 rounded-lg px-3 hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground" aria-hidden="true">{room.participantName.slice(0, 1).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-sm font-medium">{room.participantName}</span><span className="block truncate text-xs text-muted-foreground">{room.title}</span></span></Link></li>)}</ul> : <p className="px-3 text-xs leading-5 text-muted-foreground">Your recent workrooms will appear here.</p>}<Link href="/messages" onClick={closeNavigation} className="mt-2 block px-3 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">View all messages</Link></section>;
}

function NavGroup({ label, hidden, items, renderItems }: { label: string; hidden: boolean; items: NavItem[]; renderItems: (items: NavItem[]) => ReactNode }) {
  return <section className={cn("mt-6 first:mt-0", hidden && "mt-0")} aria-label={label}>{hidden ? null : <h2 className="mb-2 px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</h2>}<ul className="space-y-1">{renderItems(items)}</ul></section>;
}
