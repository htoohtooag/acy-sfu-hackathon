import { notFound } from "next/navigation";

import { FreelancerProfileDrawer } from "@/components/features/catalog/freelancer-profile-drawer";
import { getPublicFreelancerProfile } from "@/features/catalog/catalog-api";
import { mapPublicProfileToPresentation } from "@/features/catalog/catalog-data";
import { createFallbackCatalogPackageDetailPresentation, findCatalogPackageDetailPresentation } from "@/features/catalog/mock-data";

interface ProfileDrawerPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfileDrawerPage({ params }: ProfileDrawerPageProps) {
  const { id } = await params;
  const apiProfile = await getPublicFreelancerProfile(id).catch(() => null);
  if (!apiProfile) notFound();
  const resolved = mapPublicProfileToPresentation(apiProfile);
  const firstPackage = resolved.packages[0];
  const packagePresentation = firstPackage ? findCatalogPackageDetailPresentation(firstPackage.id) ?? createFallbackCatalogPackageDetailPresentation(firstPackage) : undefined;
  return <FreelancerProfileDrawer profile={resolved.profile} packages={resolved.packages} packagePresentation={packagePresentation} freelancer={resolved.freelancer} />;
}
