"use client";

import { ChevronDown, ChevronUp, Clock3, RotateCcw } from "lucide-react";

import type { PackageTierPresentation } from "@/features/catalog/mock-data";
import { formatMmk } from "@/features/catalog/catalog-data";
import { cn } from "@/lib/utils";

interface PackageTierCarouselProps {
  tiers: readonly PackageTierPresentation[];
  value: string | undefined;
  onValueChange: (tierId: string) => void;
}

export function PackageTierCarousel({ tiers, value, onValueChange }: PackageTierCarouselProps) {
  const activeIndex = Math.max(0, tiers.findIndex((tier) => tier.id === value));
  if (tiers.length === 0) return null;

  const move = (direction: -1 | 1) => {
    const nextIndex = Math.min(Math.max(activeIndex + direction, 0), tiers.length - 1);
    onValueChange(tiers[nextIndex].id);
  };

  return (
    <section aria-labelledby="package-tier-selector-heading" className="mt-4" onKeyDown={(event) => { if (event.key === "ArrowUp") { event.preventDefault(); move(-1); } if (event.key === "ArrowDown") { event.preventDefault(); move(1); } }}>
      <div className="mb-2 flex items-center justify-between gap-3"><h2 id="package-tier-selector-heading" className="font-heading text-sm font-semibold text-foreground">Available packages</h2><span className="text-xs text-muted-foreground">{activeIndex + 1} of {tiers.length}</span></div>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/30 px-2 py-3">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-14 bg-gradient-to-b from-muted to-transparent" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-14 bg-gradient-to-t from-muted to-transparent" aria-hidden="true" />
        <div className="relative z-20 flex items-center gap-2">
          <button type="button" onClick={() => move(-1)} disabled={activeIndex === 0} aria-label="Show previous package" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><ChevronUp aria-hidden="true" className="size-4" /></button>
          <ul className="flex h-64 min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-hidden" aria-label="Available packages">
            {tiers.map((tier, index) => {
              const distance = index - activeIndex;
              const isActive = distance === 0;
              const isVisible = Math.abs(distance) <= 1;
              return <li key={tier.id} className={cn("w-full shrink-0 transition-all duration-300", !isVisible && "hidden", isVisible && !isActive && "scale-90 opacity-40 blur-sm", isActive ? "order-2" : distance < 0 ? "order-1" : "order-3")}><button type="button" onClick={() => onValueChange(tier.id)} aria-current={isActive ? "true" : undefined} className={cn("w-full rounded-xl text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", isActive ? "border border-primary/60 bg-background p-3 shadow-sm" : "border border-transparent px-3 py-2 text-muted-foreground hover:bg-background/70")}><span className="flex items-center justify-between gap-2"><span className="font-heading text-sm font-semibold text-foreground">{tier.name}</span>{!isActive ? <span className="text-xs">{formatMmk(tier.priceMmk)}</span> : null}</span>{isActive ? <><span className="mt-1 block font-heading text-xl font-semibold text-primary"><data value={tier.priceMmk}>{formatMmk(tier.priceMmk)}</data></span><dl className="mt-3 grid grid-cols-2 gap-2 border-y border-border py-2 text-xs"><div><dt className="flex items-center gap-1 text-muted-foreground"><Clock3 aria-hidden="true" className="size-3.5" />Delivery</dt><dd className="mt-1 font-medium text-foreground">{tier.deliveryDays} days</dd></div><div><dt className="flex items-center gap-1 text-muted-foreground"><RotateCcw aria-hidden="true" className="size-3.5" />Revisions</dt><dd className="mt-1 font-medium text-foreground">{tier.revisions}</dd></div></dl><ul className="mt-2 flex flex-wrap gap-1.5">{tier.features.map((feature) => <li key={feature} className="rounded-md bg-muted px-2 py-1 text-[0.7rem] text-foreground">{feature}</li>)}</ul></> : null}</button></li>;
            })}
          </ul>
          <button type="button" onClick={() => move(1)} disabled={activeIndex === tiers.length - 1} aria-label="Show next package" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><ChevronDown aria-hidden="true" className="size-4" /></button>
        </div>
      </div>
    </section>
  );
}
