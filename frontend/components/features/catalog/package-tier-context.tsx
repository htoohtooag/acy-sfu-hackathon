"use client";

import { useState } from "react";

import { PackageTierCarousel } from "@/components/features/catalog/package-tier-carousel";
import type { CatalogPackageDetailPresentation } from "@/features/catalog/mock-data";

interface PackageTierContextProps {
  presentation: CatalogPackageDetailPresentation;
}

export function PackageTierContext({ presentation }: PackageTierContextProps) {
  const [selectedTierId, setSelectedTierId] = useState(presentation.tiers.find((tier) => tier.popular)?.id ?? presentation.tiers[0]?.id);
  const selectedTier = presentation.tiers.find((tier) => tier.id === selectedTierId) ?? presentation.tiers[0];
  if (!selectedTier) return null;

  return <PackageTierCarousel tiers={presentation.tiers} value={selectedTier.id} onValueChange={setSelectedTierId} />;
}
