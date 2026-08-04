import type { Metadata } from "next";
import Link from "next/link";

import { CatalogPage } from "@/components/features/catalog/catalog-page";
import { getCatalogPackages as getCatalogPackagesFromApi } from "@/features/catalog/catalog-api";
import { parseCatalogFilters, sortCatalogPackages, toCatalogPackageQuery, type CatalogSearchParams } from "@/features/catalog/catalog-data";

export const metadata: Metadata = {
  title: "Find Talent | TalentScout",
  description: "Browse trusted independent talent and services on TalentScout.",
  openGraph: { title: "Find Talent | TalentScout", description: "Browse trusted independent talent and services on TalentScout." },
};

type FreelancersPageProps = { searchParams: Promise<CatalogSearchParams> };

export default async function FreelancersPage({ searchParams }: FreelancersPageProps) {
  const filters = parseCatalogFilters(await searchParams);
  const result = await getCatalogPackagesFromApi(toCatalogPackageQuery(filters)).catch(() => null);
  if (result === null) {
    return <main id="main-content" className="flex-1 bg-muted/20"><div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Find talent</p><h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-foreground">The talent catalog is taking a quick pause.</h1><p className="mt-4 text-base leading-7 text-muted-foreground">We could not load the latest services right now. Please try again shortly.</p><Link href="/freelancers" className="mt-7 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Try again</Link></div></main>;
  }
  const items = sortCatalogPackages(result.items, filters);

  return <CatalogPage filters={filters} items={items} total={result.total} />;
}
