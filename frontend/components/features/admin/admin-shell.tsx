"use client";

import type { ReactNode } from "react";
import { CreditCard, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function AdminShell({ children, displayName }: { children: ReactNode; displayName: string | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const name = displayName ?? "Finance administrator";

  async function logOut(): Promise<void> {
    setLoggingOut(true);
    setLogoutError(null);
    const { error } = await createSupabaseBrowserClient().auth.signOut();
    if (error) {
      setLogoutError("We could not log you out. Please try again.");
      setLoggingOut(false);
      return;
    }
    queryClient.clear();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-sidebar p-5 lg:flex" aria-label="Admin navigation">
        <div className="flex items-center gap-3 px-2 py-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground"><ShieldCheck aria-hidden="true" /></span>
          <span><span className="block font-heading text-lg font-semibold">Gigmatch</span><span className="block text-xs text-muted-foreground">Operations</span></span>
        </div>
        <nav className="mt-10 flex-1 space-y-2">
          <Link href="/admin/payments" className="flex min-h-11 items-center gap-3 rounded-xl bg-primary/10 px-3 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><CreditCard aria-hidden="true" />Payment review</Link>
        </nav>
        <div className="border-t border-sidebar-border pt-4">
          <p className="truncate px-3 text-sm font-semibold">{name}</p>
          <p className="px-3 pt-1 text-xs text-muted-foreground">Finance access</p>
          {logoutError ? <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">{logoutError}</p> : null}
          <button type="button" onClick={() => { void logOut(); }} disabled={loggingOut} className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"><LogOut aria-hidden="true" />{loggingOut ? "Logging out…" : "Log out"}</button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-border bg-card px-5 py-4 lg:hidden">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck aria-hidden="true" /></span><span className="font-heading font-semibold">Gigmatch operations</span></div>
          <button type="button" onClick={() => { void logOut(); }} disabled={loggingOut} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><LogOut aria-hidden="true" />{loggingOut ? "Logging out…" : "Log out"}</button>
        </header>
        <main className={cn("min-h-screen", "lg:min-h-0")}>{children}</main>
      </div>
    </div>
  );
}
