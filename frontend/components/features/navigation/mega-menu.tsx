import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";

import type { NavigationCategory, NavigationCard } from "@/constants/navigation";
import { cn } from "@/lib/utils";

interface MegaMenuProps {
  mode: "talent" | "work";
  categories?: NavigationCategory[];
  cards?: NavigationCard[];
  onNavigate?: () => void;
}

export function MegaMenu({ mode, categories = [], cards = [], onNavigate }: MegaMenuProps) {
  if (mode === "work") {
    return (
      <div className="menu-pattern absolute inset-x-0 top-full z-40 hidden overflow-hidden rounded-b-2xl border border-border bg-background text-foreground shadow-2xl lg:block">
        <div className="mx-auto grid max-w-7xl gap-3 p-5 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.key}
                href={card.href}
                onClick={onNavigate}
                className={cn(
                  "group flex min-h-24 items-end justify-between rounded-xl border border-border bg-menu-rail/35 p-5 transition-colors hover:bg-menu-item-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  card.featured && "min-h-36",
                )}
              >
                <span className="flex max-w-[30ch] flex-col gap-2">
                  <span className="text-base font-medium">{card.label}</span>
                  <span className="text-sm leading-6 text-muted-foreground">{card.description}</span>
                </span>
                {Icon ? <Icon aria-hidden="true" className="size-5 shrink-0 text-primary transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /> : null}
              </Link>
            );
          })}
        </div>
        <div className="border-t border-border px-6 py-4">
          <Link href="/freelancers" onClick={onNavigate} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            Explore all work categories <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-x-0 top-full z-40 hidden overflow-hidden rounded-b-2xl border border-border bg-menu-surface text-foreground shadow-xl lg:block">
      <div className="mx-auto grid max-w-7xl grid-cols-[14rem_1fr]">
        <aside className="border-e border-border bg-menu-rail p-3">
          <p className="px-3 pb-3 pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Categories</p>
          <ul className="space-y-1">
            {categories.map((category, index) => (
              <li key={category.key}>
                <button
                  type="button"
                  className={cn(
                    "group flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-start text-sm font-medium text-muted-foreground transition-colors hover:bg-menu-item-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    index === 0 && "bg-menu-item-active text-foreground shadow-sm",
                  )}
                >
                  {category.label}
                  <ChevronRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="grid gap-x-8 gap-y-2 p-7 sm:grid-cols-2">
          {categories[0]?.items.concat(categories.slice(1).flatMap((category) => category.items)).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onNavigate}
                className="group flex min-h-24 gap-4 rounded-xl p-3 transition-colors hover:bg-menu-item-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-base font-semibold transition-colors group-hover:text-primary">{item.label}</span>
                  <span className="text-sm leading-6 text-muted-foreground">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="border-t border-border px-7 py-4">
        <Link href="/freelancers" onClick={onNavigate} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          See all talent categories <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </div>
  );
}
