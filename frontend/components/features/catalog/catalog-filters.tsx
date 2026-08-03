"use client";

import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type CatalogFilters, getActiveCatalogFilterCount } from "@/features/catalog/catalog-data";
import { useCatalogQueryControls } from "@/components/features/catalog/catalog-query-controls";

type CatalogFiltersProps = {
  filters: CatalogFilters;
  mobile?: boolean;
  onApplied?: () => void;
};

const categories = [
  ["design", "Design"],
  ["development", "Development & IT"],
  ["ai-automation", "AI & Automation"],
  ["marketing", "Marketing"],
  ["writing", "Writing & Content"],
] as const;

const deliveryOptions = [["", "Any delivery time"], ["1", "Within 24 hours"], ["3", "Up to 3 days"], ["7", "Up to 7 days"]] as const;

export function CatalogFilters({ filters, mobile = false, onApplied }: CatalogFiltersProps) {
  const { updateCatalogQuery, clearCatalogQuery } = useCatalogQueryControls();
  const activeCount = getActiveCatalogFilterCount(filters);

  function apply(changes: Record<string, string | null | undefined>): void {
    updateCatalogQuery(changes);
    onApplied?.();
  }

  return (
    <section className={cn("space-y-7", mobile && "pb-2")} aria-label="Catalog filters">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Filters</p>
          <p className="mt-1 text-xs text-muted-foreground">Shape your perfect shortlist.</p>
        </div>
        {activeCount > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => { clearCatalogQuery(); onApplied?.(); }}>
            <X aria-hidden="true" /> Clear all
          </Button>
        ) : null}
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">Category</legend>
        <div className="space-y-2">
          {categories.map(([value, label]) => (
            <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <input type="checkbox" checked={filters.category === value} onChange={(event) => apply({ category: event.target.checked ? value : null })} className="size-4 accent-primary" />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3 border-t border-border pt-6">
        <legend className="text-sm font-semibold text-foreground">Budget in MMK</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5 text-xs text-muted-foreground">
            <span>From</span>
            <input inputMode="numeric" value={filters.minPrice} onChange={(event) => apply({ min_price_mmk: event.target.value })} placeholder="0" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
          </label>
          <label className="space-y-1.5 text-xs text-muted-foreground">
            <span>To</span>
            <input inputMode="numeric" value={filters.maxPrice} onChange={(event) => apply({ max_price_mmk: event.target.value })} placeholder="No limit" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-2 border-t border-border pt-6">
        <legend className="mb-1 text-sm font-semibold text-foreground">Delivery time</legend>
        {deliveryOptions.map(([value, label]) => (
          <label key={label} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <input type="radio" name={mobile ? "mobile-delivery" : "delivery"} checked={filters.deliveryDays === value} onChange={() => apply({ delivery_days: value || null })} className="size-4 accent-primary" />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2 border-t border-border pt-6">
        <legend className="mb-1 text-sm font-semibold text-foreground">Freelancer level</legend>
        {[["", "All freelancers"], ["verified", "Verified talent"], ["rising", "Rising talent"]].map(([value, label]) => (
          <label key={label} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <input type="radio" name={mobile ? "mobile-level" : "level"} checked={filters.level === value} onChange={() => apply({ level: value || null })} className="size-4 accent-primary" />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>

      {mobile ? <Button type="button" className="w-full" onClick={onApplied}><SlidersHorizontal aria-hidden="true" /> Apply filters</Button> : null}
    </section>
  );
}
