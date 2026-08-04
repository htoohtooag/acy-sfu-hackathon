import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FreelancerProfileContent } from "@/components/features/catalog/freelancer-profile-content";
import { getPublicFreelancerProfile } from "@/features/catalog/catalog-api";
import { mapPublicProfileToPresentation } from "@/features/catalog/catalog-data";
import { createFallbackCatalogPackageDetailPresentation, findCatalogPackageDetailPresentation } from "@/features/catalog/mock-data";

interface FreelancerProfilePageProps {
  params: Promise<{ id: string }>;
}

async function loadProfile(id: string) {
  const profile = await getPublicFreelancerProfile(id).catch(() => null);
  return profile ? mapPublicProfileToPresentation(profile) : null;
}

export async function generateMetadata({ params }: FreelancerProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const resolved = await loadProfile(id);
  console.log(resolved, "prfoi")
  const name = resolved?.freelancer.user.full_name ?? "Freelancer";
  return { title: `${name} | TalentScout`, description: resolved?.profile.about ?? "Explore a public TalentScout freelancer profile.", openGraph: { title: `${name} | TalentScout`, description: resolved?.profile.about ?? "Explore a public TalentScout freelancer profile." } };
}

export default async function FreelancerProfilePage({ params }: FreelancerProfilePageProps) {
  const { id } = await params;
  const resolved = await loadProfile(id);
  if (!resolved) notFound();

  const firstPackage = resolved.packages[0];
  const packagePresentation = firstPackage ? findCatalogPackageDetailPresentation(firstPackage.id) ?? createFallbackCatalogPackageDetailPresentation(firstPackage) : undefined;
  return <main id="main-content" className="flex-1 bg-muted/20 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16"><FreelancerProfileContent profile={resolved.profile} packages={resolved.packages} freelancer={resolved.freelancer} packagePresentation={packagePresentation} mode="page" /></main>;
}
