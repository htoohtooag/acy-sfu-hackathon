import { notFound } from "next/navigation";
import type { CatalogPackage } from "shared/schemas";

import { FreelancerProfileDrawer } from "@/components/features/catalog/freelancer-profile-drawer";
import { findCatalogPackageDetailPresentation, findFreelancerProfilePresentation, mockCatalogPackages } from "@/features/catalog/mock-data";

interface ProfileDrawerPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfileDrawerPage({ params }: ProfileDrawerPageProps) {
  const { id } = await params;
  const profile = findFreelancerProfilePresentation(id);
  const sourcePackage = mockCatalogPackages.find((item) => item.freelancer_id === id);
  if (!profile || !sourcePackage) notFound();

  const packages: CatalogPackage[] = sourcePackage ? [sourcePackage, ...profile.otherPackageIds.map((packageId) => mockCatalogPackages.find((item) => item.id === packageId)).filter((item): item is CatalogPackage => Boolean(item))] : [];

  return <FreelancerProfileDrawer profile={profile} packages={packages} packagePresentation={findCatalogPackageDetailPresentation(sourcePackage.id)} />;
}
