import { Suspense } from "react";
import type { CatalogPackage } from "shared/schemas";

import { CatalogFilters } from "@/components/features/catalog/catalog-filters";
import { CatalogResults } from "@/components/features/catalog/catalog-results";
import { MobileCatalogFilters } from "@/components/features/catalog/mobile-catalog-filters";
import type { CatalogFilters as CatalogFilterValues } from "@/features/catalog/catalog-data";

type CatalogPageProps = { filters: CatalogFilterValues; items: CatalogPackage[]; total: number };

function ResultsLoading() {
  return <div className="mt-6 space-y-5" role="status" aria-label="Loading catalog results"><div className="h-64 animate-pulse rounded-2xl bg-muted" /><div className="h-64 animate-pulse rounded-2xl bg-muted" /><span className="sr-only">Loading services</span></div>;
}

export function CatalogPage({ filters, items, total }: CatalogPageProps) {
  return (
    <main id="main-content" className="flex-1 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <div className="mb-8 flex flex-col gap-5 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Talent catalog</p>
            <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Good work starts with the right fit.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">Browse trusted independent talent and find a service that fits your next meaningful milestone.</p>
          </div>
          <div className="md:hidden"><MobileCatalogFilters filters={filters} /></div>
        </div>
        <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="hidden h-fit max-h-[calc(100vh-7rem)] self-start overflow-y-auto rounded-2xl bg-card p-5 shadow-sm lg:sticky lg:top-24 lg:block"><CatalogFilters filters={filters} /></aside>
          <Suspense fallback={<ResultsLoading />}><CatalogResults items={items} filters={filters} total={total} /></Suspense>
        </div>
      </div>
    </main>
  );
}
