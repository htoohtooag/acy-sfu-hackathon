"use client";

import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown, CircleGauge, LogOut, Settings, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppStore, type AppRole } from "@/store/use-app-store";
import type { AppUser } from "@/features/app/app-types";

type AppProfilePopoverProps = { user: AppUser; compact?: boolean };

const roleNames: Record<AppRole, string> = { CLIENT: "Client view", FREELANCER: "Freelancer view" };

export function AppProfilePopover({ user, compact = false }: AppProfilePopoverProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeRole = useAppStore((state) => state.activeRole);
  const setActiveRole = useAppStore((state) => state.setActiveRole);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const displayName = user.fullName ?? user.email.split("@")[0] ?? "Gigmatch member";
  const initials = displayName.slice(0, 2).toUpperCase();
  const canSwitchRoles = user.roles.length > 1;

  async function logOut(): Promise<void> {
    setLoggingOut(true);
    setLogoutError(null);

    try {
      const { error } = await createSupabaseBrowserClient().auth.signOut();
      if (error) {
        setLogoutError("We could not log you out. Please try again.");
        return;
      }

      queryClient.clear();
      router.replace("/login");
      router.refresh();
    } catch (error: unknown) {
      console.error("Logout failed.", error);
      setLogoutError("We could not log you out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          "group flex min-h-16 w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          compact && "mx-auto size-12 min-h-12 w-12 justify-center p-0",
        )}
        aria-label={`Open profile menu for ${displayName}`}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-sm font-semibold text-secondary-foreground" aria-hidden="true">
          {initials}
        </span>
        {!compact ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-foreground">{displayName}</span>
            <span className="block truncate text-xs text-muted-foreground">{roleNames[activeRole]} · {user.planLevel}</span>
          </span>
        ) : null}
        {!compact ? <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-aria-expanded:rotate-180" aria-hidden="true" /> : null}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="right" align="start" sideOffset={12} className="z-50 outline-none">
          <Popover.Popup className="w-72 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg outline-none data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0">
            <div className="border-b border-border px-3 pb-3 pt-2">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>

            {canSwitchRoles ? (
              <fieldset className="space-y-1 border-b border-border p-2 pb-3">
                <legend className="px-1 pb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Switch view</legend>
                {user.roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setActiveRole(role)}
                    className="flex min-h-10 w-full items-center gap-3 rounded-lg px-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span className={cn("grid size-4 place-items-center rounded-full border", activeRole === role && "border-primary bg-primary text-primary-foreground")}>
                      {activeRole === role ? <Check className="size-3" aria-hidden="true" /> : null}
                    </span>
                    {roleNames[role]}
                  </button>
                ))}
              </fieldset>
            ) : null}

            <div className="p-2">
              <Link href="/profile" className="flex min-h-10 items-center gap-3 rounded-lg px-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><UserRound className="size-4" aria-hidden="true" />My profile</Link>
              <Link href="/account-health" className="flex min-h-10 items-center gap-3 rounded-lg px-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><CircleGauge className="size-4" aria-hidden="true" />Account health</Link>
              <Link href="/settings" className="flex min-h-10 items-center gap-3 rounded-lg px-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><Settings className="size-4" aria-hidden="true" />Settings</Link>
            </div>

            <div className="border-y border-border p-2">
              <Link href="/membership" className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <Sparkles className="size-4 text-primary" aria-hidden="true" />
                <span className="min-w-0 flex-1"><span className="block font-semibold">{user.planLevel === "FREE" ? "Upgrade to Gold" : "Manage membership"}</span><span className="block text-xs text-muted-foreground">Unlock more room to grow</span></span>
              </Link>
            </div>

            <div className="p-2">
              {logoutError ? <p className="mb-2 rounded-lg bg-destructive/10 px-2 py-2 text-xs text-destructive" role="alert">{logoutError}</p> : null}
              <button type="button" disabled={loggingOut} aria-busy={loggingOut} onClick={() => { void logOut(); }} className="flex min-h-10 w-full items-center gap-3 rounded-lg px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"><LogOut className="size-4" aria-hidden="true" />{loggingOut ? "Logging out…" : "Log out"}</button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
