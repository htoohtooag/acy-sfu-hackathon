import { notFound } from "next/navigation";

import { PackageDetailModal } from "@/components/features/catalog/package-detail-modal";
import { getCatalogPackage } from "@/features/catalog/catalog-api";

type PackageModalPageProps = { params: Promise<{ id: string }> };

export default async function PackageModalPage({ params }: PackageModalPageProps) {
  const { id } = await params;
  const item = await getCatalogPackage(id).catch(() => null);
  if (!item) notFound();

  return <PackageDetailModal item={item} />;
}
