import { notFound } from "next/navigation";

import { PackageDetailContent } from "@/components/features/catalog/package-detail-content";
import { findMockCatalogPackage } from "@/features/catalog/mock-data";

type PackagePageProps = { params: Promise<{ id: string }> };

export default async function PackagePage({ params }: PackagePageProps) {
  const { id } = await params;
  const item = findMockCatalogPackage(id);
  if (!item) notFound();

  return (
    <main id="main-content" className="flex-1 bg-muted/20 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <PackageDetailContent item={item} mode="page" />
    </main>
  );
}
