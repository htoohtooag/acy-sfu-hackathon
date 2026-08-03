"use client";

import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { type CatalogFilters, getActiveCatalogFilterCount } from "@/features/catalog/catalog-data";
import { CatalogFilters as CatalogFiltersPanel } from "@/components/features/catalog/catalog-filters";

type MobileCatalogFiltersProps = { filters: CatalogFilters };

export function MobileCatalogFilters({ filters }: MobileCatalogFiltersProps) {
  const activeCount = getActiveCatalogFilterCount(filters);

  return (
    <Sheet>
      <SheetTrigger render={<Button type="button" variant="outline" className="min-h-11" />}>
        <SlidersHorizontal aria-hidden="true" /> Filters{activeCount > 0 ? ` (${activeCount})` : ""}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Refine your search</SheetTitle>
          <SheetDescription>Choose the details that matter for this project.</SheetDescription>
        </SheetHeader>
        <CatalogFiltersPanel filters={filters} mobile />
      </SheetContent>
    </Sheet>
  );
}
