import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FreelancerProfileContent } from "@/components/features/catalog/freelancer-profile-content";
import { findCatalogPackageDetailPresentation, findFreelancerProfilePresentation, mockCatalogPackages } from "@/features/catalog/mock-data";

interface FreelancerProfilePageProps {
  params: Promise<{ id: string }>;
}

function resolveProfile(id: string) {
  const profile = findFreelancerProfilePresentation(id);
  const sourcePackage = mockCatalogPackages.find((item) => item.freelancer_id === id && item.is_active);
  if (!profile || !sourcePackage) return undefined;

  const packages = [sourcePackage, ...profile.otherPackageIds.map((packageId) => mockCatalogPackages.find((item) => item.id === packageId)).filter((item): item is (typeof mockCatalogPackages)[number] => Boolean(item))];
  return { profile, packages };
}

export async function generateMetadata({ params }: FreelancerProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const resolved = resolveProfile(id);
  const name = resolved?.packages[0]?.freelancer.user.full_name ?? "Freelancer";
  return { title: `${name} | TalentScout`, description: resolved?.profile.about ?? "Explore a public TalentScout freelancer profile." };
}

export default async function FreelancerProfilePage({ params }: FreelancerProfilePageProps) {
  const { id } = await params;
  const resolved = resolveProfile(id);
  if (!resolved) notFound();

  return <main id="main-content" className="flex-1 bg-muted/20 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16"><FreelancerProfileContent profile={resolved.profile} packages={resolved.packages} packagePresentation={findCatalogPackageDetailPresentation(resolved.packages[0].id)} mode="page" /></main>;
}
