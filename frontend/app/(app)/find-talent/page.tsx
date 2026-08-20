import type { Metadata } from "next";
import Link from "next/link";

import { CatalogPage } from "@/components/features/catalog/catalog-page";
import { getCatalogPackages } from "@/features/catalog/catalog-api";
import { parseCatalogFilters, sortCatalogPackages, toCatalogPackageQuery, type CatalogSearchParams } from "@/features/catalog/catalog-data";

export const metadata: Metadata = {
  title: "Find Talent | Gigmatch",
  description: "Browse trusted independent talent and services on Gigmatch.",
};

type FindTalentPageProps = { searchParams: Promise<CatalogSearchParams> };

export default async function FindTalentPage({ searchParams }: FindTalentPageProps) {
  const filters = parseCatalogFilters(await searchParams);
  const result = await getCatalogPackages(toCatalogPackageQuery(filters)).catch(() => null);

  if (result === null) return <main id="main-content" className="flex-1 bg-muted/20"><div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Find talent</p><h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-foreground">The talent catalog is taking a quick pause.</h1><p className="mt-4 text-base leading-7 text-muted-foreground">We could not load the latest services right now. Please try again shortly.</p><Link href="/find-talent" className="mt-7 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Try again</Link></div></main>;
  return <CatalogPage filters={filters} items={sortCatalogPackages(result.items, filters)} total={result.total} packageDetailPath="/packages" />;
}
