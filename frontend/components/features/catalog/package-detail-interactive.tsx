"use client";

import type { CatalogPackage } from "shared/schemas";

import { PackageGallery } from "@/components/features/catalog/package-gallery";
import { PackageRelatedCarousel } from "@/components/features/catalog/package-related-carousel";
import type { CatalogPackageDetailPresentation, PackageGalleryItem } from "@/features/catalog/mock-data";

interface PackageDetailInteractiveProps {
  item: CatalogPackage;
  presentation: CatalogPackageDetailPresentation;
  relatedPackages: CatalogPackage[];
  freelancerName: string;
}

export function PackageDetailInteractive({ item, presentation, relatedPackages, freelancerName }: PackageDetailInteractiveProps) {
  const sampleWorkGallery: PackageGalleryItem[] = item.freelancer.sample_works
    .filter((sampleWork) => sampleWork.image_url.trim().length > 0)
    .map((sampleWork) => ({ id: sampleWork.id, imageUrl: sampleWork.image_url, alt: sampleWork.title }));
  const gallery = sampleWorkGallery.length > 0 ? sampleWorkGallery : presentation.gallery;

  return (
    <>
      <PackageGallery items={gallery} packageTitle={item.title} />
      <PackageRelatedCarousel packages={relatedPackages} freelancerName={freelancerName} />
    </>
  );
}
