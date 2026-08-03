"use client";

import type { CatalogPackage } from "shared/schemas";

import { PackageGallery } from "@/components/features/catalog/package-gallery";
import { PackageRelatedCarousel } from "@/components/features/catalog/package-related-carousel";
import type { CatalogPackageDetailPresentation } from "@/features/catalog/mock-data";

interface PackageDetailInteractiveProps {
  item: CatalogPackage;
  presentation: CatalogPackageDetailPresentation;
  relatedPackages: CatalogPackage[];
  freelancerName: string;
}

export function PackageDetailInteractive({ item, presentation, relatedPackages, freelancerName }: PackageDetailInteractiveProps) {
  return (
    <>
      <PackageGallery items={presentation.gallery} packageTitle={item.title} />
      <PackageRelatedCarousel packages={relatedPackages} freelancerName={freelancerName} />
    </>
  );
}
