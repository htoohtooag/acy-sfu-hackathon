"use client";

import Image from "next/image";
import { Heart, MapPin } from "lucide-react";
import { useState } from "react";
import type { CatalogPackage } from "shared/schemas";

import { Button } from "@/components/ui/button";
import type { FreelancerProfilePresentation } from "@/features/catalog/mock-data";

interface FreelancerProfileHeroProps {
  profile: FreelancerProfilePresentation;
  freelancer: CatalogPackage["freelancer"];
}

export function FreelancerProfileHero({ profile, freelancer }: FreelancerProfileHeroProps) {
  const [saved, setSaved] = useState(false);
  const name = freelancer.user.full_name ?? "Gigmatch freelancer";
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2);

  return <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-labelledby="freelancer-profile-heading"><div className="relative h-36 overflow-hidden bg-muted sm:h-44"><Image src={profile.bannerImageUrl ?? "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1800&q=82"} alt="Abstract product design work from this freelancer" fill sizes="(min-width: 1280px) 80rem, 100vw" className="object-cover opacity-90" /><div className="absolute inset-0 bg-foreground/20" aria-hidden="true" /></div><div className="relative px-5 pb-5 sm:px-7"><div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between"><div className="flex min-w-0 items-end gap-3"><span className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-primary text-xl font-bold text-primary-foreground shadow-md sm:size-28">{profile.profileImageUrl ? <Image src={profile.profileImageUrl} alt={`${name} profile`} fill sizes="7rem" className="object-cover" /> : initials}<span className="absolute bottom-0 end-1 size-3 rounded-full border-2 border-card bg-primary" aria-label="Available now" /></span><div className="min-w-0 pb-1"><h1 id="freelancer-profile-heading" className="flex flex-wrap items-center gap-1.5 font-heading text-2xl font-semibold text-foreground sm:text-3xl">{name}{freelancer.is_verified ? <span className="text-sm font-medium text-primary">Verified</span> : null}</h1><p className="mt-1 text-sm text-muted-foreground sm:text-base">{freelancer.headline ?? "Independent professional"}</p><p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><MapPin aria-hidden="true" className="size-3.5" />{freelancer.location_city ?? "Myanmar"}, Myanmar{profile.localTime ? <span>• {profile.localTime}</span> : null}</p></div></div><div className="flex items-center gap-2 sm:pb-1"><button type="button" onClick={() => setSaved((current) => !current)} aria-pressed={saved} aria-label={saved ? `Remove ${name} from saved freelancers` : `Save ${name}`} className="inline-flex size-11 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><Heart aria-hidden="true" className={saved ? "size-5 fill-current text-primary" : "size-5"} /></button><Button type="button" size="lg">Contact me</Button></div></div></div></section>;
}
