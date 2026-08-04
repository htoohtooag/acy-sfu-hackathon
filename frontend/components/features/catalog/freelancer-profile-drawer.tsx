"use client";

import { useRouter } from "next/navigation";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PackageDetailClose } from "@/components/features/catalog/package-detail-close";
import { FreelancerProfileContent } from "@/components/features/catalog/freelancer-profile-content";
import type { CatalogPackage } from "shared/schemas";
import type { CatalogPackageDetailPresentation, FreelancerProfilePresentation } from "@/features/catalog/mock-data";

interface FreelancerProfileDrawerProps {
  profile: FreelancerProfilePresentation;
  packages: CatalogPackage[];
  freelancer?: CatalogPackage["freelancer"];
  packagePresentation?: CatalogPackageDetailPresentation;
}

export function FreelancerProfileDrawer({ profile, packages, freelancer, packagePresentation }: FreelancerProfileDrawerProps) {
  const router = useRouter();

  return <Sheet open onOpenChange={(open) => { if (!open) router.back(); }}><SheetContent aria-describedby="freelancer-profile-description" className="max-w-xl gap-0 p-0"><SheetHeader className="sticky top-0 z-10 flex-row items-start gap-4 border-b border-border bg-background/95 p-5 backdrop-blur-sm sm:p-6"><div className="min-w-0 flex-1"><SheetTitle className="sr-only">Freelancer profile</SheetTitle><SheetDescription id="freelancer-profile-description">Review this freelancer&apos;s experience and other packages.</SheetDescription></div><PackageDetailClose label="Close freelancer profile" /></SheetHeader><div className="p-5 sm:p-6"><FreelancerProfileContent profile={profile} packages={packages} freelancer={freelancer} packagePresentation={packagePresentation} mode="drawer" /></div></SheetContent></Sheet>;
}
