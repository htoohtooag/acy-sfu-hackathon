import { notFound } from "next/navigation";

import { PackageDetailModal } from "@/components/features/catalog/package-detail-modal";
import { findMockCatalogPackage } from "@/features/catalog/mock-data";

type PackageModalPageProps = { params: Promise<{ id: string }> };

export default async function PackageModalPage({ params }: PackageModalPageProps) {
  const { id } = await params;
  const item = findMockCatalogPackage(id);
  if (!item) notFound();

  return <PackageDetailModal item={item} />;
}
