"use client";

import { Check, Clock3, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { CatalogPackage } from "shared/schemas";

import { Button } from "@/components/ui/button";
import type { CatalogPackageDetailPresentation, FreelancerProfilePresentation } from "@/features/catalog/mock-data";
import { formatMmk } from "@/features/catalog/catalog-data";
import { cn } from "@/lib/utils";

interface FreelancerPackageSidebarProps {
  item: CatalogPackage;
  presentation: CatalogPackageDetailPresentation;
  profile: FreelancerProfilePresentation;
}

export function FreelancerPackageSidebar({ item, presentation, profile }: FreelancerPackageSidebarProps) {
  const [selectedTierId, setSelectedTierId] = useState(presentation.tiers.find((tier) => tier.popular)?.id ?? presentation.tiers[0]?.id);
  const selectedTier = presentation.tiers.find((tier) => tier.id === selectedTierId) ?? presentation.tiers[0];
  if (!selectedTier) return null;

  return <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start"><section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-labelledby="profile-package-heading"><div className="flex border-b border-border" role="tablist" aria-label="Package tiers">{presentation.tiers.map((tier) => <button key={tier.id} type="button" role="tab" aria-selected={tier.id === selectedTier.id} onClick={() => setSelectedTierId(tier.id)} className={cn("min-h-11 flex-1 px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring", tier.id === selectedTier.id && "border-b-2 border-primary bg-muted/30 text-primary")}>{tier.name}</button>)}</div><div className="p-5"><h2 id="profile-package-heading" className="font-heading text-lg font-semibold text-foreground">{selectedTier.name} package</h2><div className="mt-1 flex items-center justify-between gap-3"><data value={selectedTier.priceMmk} className="font-heading text-2xl font-semibold text-foreground">{formatMmk(selectedTier.priceMmk)}</data><span className="text-sm text-muted-foreground">{item.freelancer.is_verified ? "Verified talent" : "Independent talent"}</span></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{selectedTier.summary}</p><dl className="mt-4 grid grid-cols-2 gap-3 border-y border-border py-3 text-xs"><div><dt className="flex items-center gap-1 text-muted-foreground"><Clock3 aria-hidden="true" className="size-3.5" />Delivery</dt><dd className="mt-1 font-medium text-foreground">{selectedTier.deliveryDays} days</dd></div><div><dt className="flex items-center gap-1 text-muted-foreground"><RotateCcw aria-hidden="true" className="size-3.5" />Revisions</dt><dd className="mt-1 font-medium text-foreground">{selectedTier.revisions}</dd></div></dl><ul className="mt-4 space-y-2">{selectedTier.features.map((feature) => <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground"><Check aria-hidden="true" className="size-4 text-primary" />{feature}</li>)}</ul><Button type="button" className="mt-5 w-full">Continue <span aria-hidden="true">→</span></Button></div></section><section className="rounded-2xl border border-border bg-card p-5 shadow-sm" aria-labelledby="profile-languages-heading"><h2 id="profile-languages-heading" className="font-heading text-base font-semibold text-foreground">Languages</h2><ul className="mt-3 divide-y divide-border text-sm">{(profile.languages ?? [{ name: "English", fluency: "Fluent" }]).map((language) => <li key={language.name} className="flex justify-between gap-4 py-2 text-muted-foreground"><span>{language.name}</span><span>{language.fluency}</span></li>)}</ul></section><section className="rounded-2xl border border-border bg-card p-5 shadow-sm" aria-labelledby="profile-sidebar-skills-heading"><h2 id="profile-sidebar-skills-heading" className="font-heading text-base font-semibold text-foreground">Skills</h2><ul className="mt-3 flex flex-wrap gap-2">{profile.skills.map((skill) => <li key={skill} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-foreground">{skill}</li>)}</ul></section></aside>;
}
