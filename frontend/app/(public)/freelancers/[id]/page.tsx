import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PackageDetailContent } from "@/components/features/catalog/package-detail-content";
import { getCatalogPackage } from "@/features/catalog/catalog-api";

type PackageDetailPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PackageDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getCatalogPackage(id).catch(() => null);
  if (!item) return { title: "Package not found | TalentScout" };

  return {
    title: `${item.title} | TalentScout`,
    description: item.description ?? `Explore a service from ${item.freelancer.user.full_name ?? "TalentScout talent"}.`,
  };
}

export default async function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { id } = await params;
  const item = await getCatalogPackage(id).catch(() => null);
  if (!item) notFound();

  return <main id="main-content" className="flex-1 bg-muted/20 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
    <PackageDetailContent item={item} mode="page" />
    </main>;
}
