import type { Metadata } from "next";

import { CatalogPage } from "@/components/features/catalog/catalog-page";
import { getCatalogPackages, parseCatalogFilters, type CatalogSearchParams } from "@/features/catalog/catalog-data";

export const metadata: Metadata = {
  title: "Find Talent | TalentScout",
  description: "Browse trusted independent talent and services on TalentScout.",
};

type FreelancersPageProps = { searchParams: Promise<CatalogSearchParams> };

export default async function FreelancersPage({ searchParams }: FreelancersPageProps) {
  const filters = parseCatalogFilters(await searchParams);
  const items = getCatalogPackages(filters);

  return <CatalogPage filters={filters} items={items} />;
}
