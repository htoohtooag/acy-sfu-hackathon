"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";

import { findTalentCategories, findWorkCards, publicLinks, type NavigationItem } from "@/constants/navigation";
import { MegaMenu } from "@/components/features/navigation/mega-menu";
import { MobileNavbar } from "@/components/features/navigation/mobile-navbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MenuKey = "talent" | "work" | null;

export function PublicNavbar() {
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const renderMenuTrigger = (key: Exclude<MenuKey, null>, label: string) => (
    <button
      type="button"
      aria-expanded={openMenu === key}
      aria-haspopup="true"
      onPointerEnter={() => setOpenMenu(key)}
      onFocus={() => setOpenMenu(key)}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 border-b-2 border-transparent px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        openMenu === key && "border-primary text-foreground",
      )}
    >
      {label}
      <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform", openMenu === key && "rotate-180")} />
    </button>
  );

  const renderPublicLink = (link: NavigationItem) => (
    <Link key={link.key} href={link.href} className="inline-flex min-h-11 items-center px-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
      {link.label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur">
      <div
        className="relative mx-auto flex min-h-18 max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8"
        onPointerLeave={() => setOpenMenu(null)}
      >
        <Link href="/" className="shrink-0 font-heading text-2xl font-bold tracking-tight text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          TalentScout
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex">
          <div onPointerEnter={() => setOpenMenu("talent")}>
            {renderMenuTrigger("talent", "Find Talent")}
          </div>
          <div onPointerEnter={() => setOpenMenu("work")}>
            {renderMenuTrigger("work", "Find Work")}
          </div>
          {publicLinks.map(renderPublicLink)}
        </nav>
        <div className="ms-auto hidden items-center gap-3 lg:flex">
          <form action="/freelancers" className="flex min-h-11 w-52 items-center gap-3 rounded-full border border-input bg-muted/30 px-4 text-sm text-muted-foreground transition-colors hover:bg-muted focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
            <Search aria-hidden="true" className="size-4 shrink-0" />
            <label className="sr-only" htmlFor="desktop-service-search">Search services</label>
            <input id="desktop-service-search" name="search" type="search" placeholder="Search services" className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground" />
          </form>
          <Link href="/login" className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            Log in
          </Link>
          <Button nativeButton={false} render={<Link href="/signup">Join now</Link>} />
        </div>
        <div className="ms-auto flex items-center gap-2 lg:hidden">
          <Link href="/freelancers" aria-label="Search services" className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            <Search aria-hidden="true" className="size-5" />
          </Link>
          <MobileNavbar />
        </div>
        {openMenu === "talent" ? (
          <div onPointerEnter={() => setOpenMenu("talent")}>
            <MegaMenu mode="talent" categories={findTalentCategories} onNavigate={() => setOpenMenu(null)} />
          </div>
        ) : null}
        {openMenu === "work" ? (
          <div onPointerEnter={() => setOpenMenu("work")}>
            <MegaMenu mode="work" cards={findWorkCards} onNavigate={() => setOpenMenu(null)} />
          </div>
        ) : null}
      </div>
    </header>
  );
}
