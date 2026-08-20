import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, Medal, Star } from "lucide-react";
import type { CatalogPackage, FreelancerPublicSampleWork } from "shared/schemas";

import { Button } from "@/components/ui/button";
import { FreelancerPackageSidebar } from "@/components/features/catalog/freelancer-package-sidebar";
import { FreelancerPortfolio } from "@/components/features/catalog/freelancer-portfolio";
import { FreelancerProfileHero } from "@/components/features/catalog/freelancer-profile-hero";
import { FreelancerProfileMetrics } from "@/components/features/catalog/freelancer-profile-metrics";
import { FreelancerWorkHistory } from "@/components/features/catalog/freelancer-work-history";
import { PublicMarketplaceFooter } from "@/components/features/catalog/public-marketplace-footer";
import type { CatalogPackageDetailPresentation, FreelancerProfilePresentation } from "@/features/catalog/mock-data";
import { formatMmk } from "@/features/catalog/catalog-data";

interface FreelancerProfileContentProps {
  profile: FreelancerProfilePresentation;
  packages: CatalogPackage[];
  freelancer?: CatalogPackage["freelancer"];
  mode: "drawer" | "page";
  packagePresentation?: CatalogPackageDetailPresentation;
  sampleWorks?: readonly FreelancerPublicSampleWork[];
}

export function FreelancerProfileContent({ profile, packages, freelancer: freelancerProp, mode, packagePresentation, sampleWorks = [] }: FreelancerProfileContentProps) {
  const freelancer = packages[0]?.freelancer ?? freelancerProp;
  const name = freelancer?.user.full_name ?? "Gigmatch freelancer";
  const headline = freelancer?.headline ?? "Independent professional";
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2);
  const gallery = profile.portfolioGallery ?? [];
  const history = profile.workHistory ?? [];

  if (!freelancer) return null;

  if (mode === "drawer") {
    return <article className="w-full"><header className="flex items-start gap-4"><span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-lg font-bold text-primary-foreground">{profile.profileImageUrl ? <Image src={profile.profileImageUrl} alt={`${name} profile`} fill sizes="4rem" className="object-cover" /> : initials}</span><div className="min-w-0 flex-1"><h1 className="flex items-center gap-1.5 font-heading text-2xl font-semibold text-foreground">{name}{freelancer.is_verified ? <BadgeCheck aria-label="Verified freelancer" className="size-5 text-primary" /> : null}</h1><p className="mt-1 text-base text-muted-foreground">{headline}</p><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin aria-hidden="true" className="size-4" />{freelancer.location_city ?? "Myanmar"}, Myanmar</p></div></header><Button type="button" size="lg" className="mt-6 w-full">Contact</Button><dl className="mt-7 grid grid-cols-3 gap-3 border-y border-border py-6"><div><dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Success rate</dt><dd className="mt-2 font-heading text-2xl font-semibold text-foreground">{profile.successRate}%</dd></div><div><dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Completed</dt><dd className="mt-2 font-heading text-2xl font-semibold text-foreground">{profile.completedCount}</dd></div><div><dt className="flex items-center gap-1 text-xs uppercase tracking-[0.12em] text-muted-foreground"><Medal aria-hidden="true" className="size-4 text-primary" />Status</dt><dd className="mt-2 font-heading text-lg font-semibold text-primary">{profile.ratingLabel}</dd></div></dl><section className="mt-7" aria-labelledby="drawer-profile-about-heading"><h2 id="drawer-profile-about-heading" className="font-heading text-xl font-semibold text-foreground">About</h2><p className="mt-3 text-base leading-7 text-muted-foreground">{profile.about}</p></section><section className="mt-7" aria-labelledby="drawer-profile-skills-heading"><h2 id="drawer-profile-skills-heading" className="font-heading text-xl font-semibold text-foreground">Skills</h2><ul className="mt-3 flex flex-wrap gap-2">{profile.skills.map((skill) => <li key={skill} className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground">{skill}</li>)}</ul></section><section className="mt-7" aria-labelledby="drawer-profile-packages-heading"><div className="flex items-center justify-between gap-3"><h2 id="drawer-profile-packages-heading" className="font-heading text-xl font-semibold text-foreground">Other packages</h2><span className="flex items-center gap-1 text-sm text-muted-foreground"><Star aria-hidden="true" className="size-4 fill-current text-primary" />{profile.rating.toFixed(1)} ({profile.reviewCount})</span></div><ul className="mt-4 space-y-3">{packages.map((item) => <li key={item.id}><Link href={`/freelancers/${item.id}`} className="flex items-start justify-between gap-4 rounded-xl border border-border p-4 transition-colors hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><span className="min-w-0"><span className="block truncate font-medium text-foreground">{item.title}</span><span className="mt-1 block line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</span></span><data value={item.price_mmk} className="shrink-0 text-sm font-semibold text-foreground">{formatMmk(item.price_mmk)}</data></Link></li>)}</ul></section></article>;
  }

  return <div className="w-full"><div className="mx-auto max-w-7xl space-y-6"><section><FreelancerProfileHero profile={profile} freelancer={freelancer} /><FreelancerProfileMetrics profile={profile} /></section><div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">{sampleWorks.length > 0 ? <FreelancerPortfolio profile={profile} gallery={gallery} name={name} sampleWorks={sampleWorks} /> : null}{packagePresentation && packages[0] ? <FreelancerPackageSidebar item={packages[0]} presentation={packagePresentation} profile={profile} /> : null}</div><FreelancerWorkHistory history={history} /></div><PublicMarketplaceFooter /></div>;
}
