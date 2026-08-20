"use client";

import { ArrowRight, ChevronDown, LayoutGrid, List, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CatalogResultCard, type CatalogPackageDetailPath } from "@/components/features/catalog/catalog-result-card";
import { type CatalogFilters } from "@/features/catalog/catalog-data";
import type { CatalogPackage } from "shared/schemas";
import { useCatalogQueryControls } from "@/components/features/catalog/catalog-query-controls";

type CatalogResultsProps = { items: CatalogPackage[]; filters: CatalogFilters; total: number; packageDetailPath: CatalogPackageDetailPath };

const quickFilters = [
  { id: "location", label: "Location", queryKey: "location", options: [["", "Any location"], ["Yangon", "Yangon"], ["Mandalay", "Mandalay"], ["Mawlamyine", "Mawlamyine"]] },
  { id: "language", label: "Languages", queryKey: "language", options: [["", "Any language"], ["English", "English"], ["Burmese", "Burmese"]] },
  { id: "skill", label: "Skills", queryKey: "skill", options: [["", "Any skill"], ["Figma", "Figma"], ["Next.js", "Next.js"], ["Copywriting", "Copywriting"], ["Zapier", "Zapier"]] },
  { id: "english-level", label: "English level", queryKey: "english_level", options: [["", "Any level"], ["Fluent", "Fluent"], ["Conversational", "Conversational"]] },
] as const;

export function CatalogResults({ items, filters, total, packageDetailPath }: CatalogResultsProps) {
  const { updateCatalogQuery, clearCatalogQuery } = useCatalogQueryControls();
  return (
    <section aria-labelledby="catalog-results-heading" aria-live="polite" className="min-w-0">
      <div className="flex flex-col gap-5 border-b border-border pb-5">
        <div>
          <p className="text-sm font-medium text-primary">Find your next great collaborator</p>
          <h2 id="catalog-results-heading" className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{filters.search ? `Results for “${filters.search}”` : "Services built for momentum"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{total.toLocaleString("en-US")} services ready to help you move.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {quickFilters.map((filter) => (
            <label key={filter.id} className="relative">
              <span className="sr-only">{filter.label}</span>
              <select value={filters[filter.id === "english-level" ? "englishLevel" : filter.id]} onChange={(event) => updateCatalogQuery({ [filter.queryKey]: event.target.value })} className="h-11 appearance-none rounded-xl border border-input bg-background py-2 pe-9 ps-4 text-sm text-foreground outline-none transition-colors hover:border-primary/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30">
                {filter.options.map(([value, label]) => <option key={value} value={value}>{value ? label : filter.label}</option>)}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </label>
          ))}
          <label className="relative ms-auto">
            <span className="sr-only">Sort results</span>
            <select value={filters.sort} onChange={(event) => updateCatalogQuery({ sort: event.target.value })} className="h-11 appearance-none rounded-xl border border-input bg-background py-2 pe-9 ps-4 text-sm font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30">
              <option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="fastest">Fastest delivery</option>
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </label>
          <div className="hidden rounded-lg border border-border p-1 sm:flex" aria-label="Result display mode">
            <Button type="button" size="icon-sm" variant="secondary" aria-label="List view"><List aria-hidden="true" /></Button><Button type="button" size="icon-sm" variant="ghost" aria-label="Grid view"><LayoutGrid aria-hidden="true" /></Button>
          </div>
        </div>
      </div>
      {items.length > 0 ? <ul className="mt-6 space-y-6">{items.map((item, index) => <li key={item.id}>
        <CatalogResultCard item={item} index={index} packageDetailPath={packageDetailPath} /></li>)}</ul> : (
        <div className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <SearchX aria-hidden="true" className="size-10 text-muted-foreground" /><h3 className="mt-5 font-heading text-xl font-semibold text-foreground">No services match those filters</h3><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Try a broader search or clear your filters to see more independent talent.</p><Button type="button" variant="outline" className="mt-5" onClick={clearCatalogQuery}>Clear filters <ArrowRight aria-hidden="true" /></Button>
        </div>
      )}
    </section>
  );
}
