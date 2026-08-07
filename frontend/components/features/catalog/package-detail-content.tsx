import Link from "next/link";
import { BadgeCheck, CalendarDays, MapPin, Star } from "lucide-react";
import type { CatalogPackage } from "shared/schemas";

import { Button } from "@/components/ui/button";
import { PackageDetailInteractive } from "@/components/features/catalog/package-detail-interactive";
import { PackageReportIssue } from "@/components/features/catalog/package-report-issue";
import { PackageTierContext } from "@/components/features/catalog/package-tier-context";
import { catalogPackagePresentation, createFallbackCatalogPackageDetailPresentation, findCatalogPackageDetailPresentation, getFreelancerPackages, mockCatalogPackages } from "@/features/catalog/mock-data";
import { cn } from "@/lib/utils";

interface PackageDetailContentProps {
  item: CatalogPackage;
  mode: "modal" | "page";
}

export function PackageDetailContent({ item, mode }: PackageDetailContentProps) {
  const presentation = findCatalogPackageDetailPresentation(item.id) ?? createFallbackCatalogPackageDetailPresentation(item);
  const fallbackPresentation = catalogPackagePresentation[item.id];
  const freelancerName = item.freelancer.user.full_name ?? "TalentScout freelancer";
  const initials = freelancerName.split(" ").map((part) => part[0]).join("").slice(0, 2);

  const relatedPackages = presentation.relatedPackageIds.map((id) => mockCatalogPackages.find((packageItem) => packageItem.id === id) ?? undefined).filter((packageItem): packageItem is CatalogPackage => Boolean(packageItem));
  const otherPackages = getFreelancerPackages(item.freelancer_id).filter((packageItem) => packageItem.id !== item.id);
  const related = relatedPackages.length > 0 ? relatedPackages : otherPackages;
  const visibleSkills = presentation.skillsAndDeliverables.slice(0, 4);
  const context = <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-4 text-xs"><div><dt className="text-muted-foreground">Published</dt><dd className="mt-1 flex items-center gap-1.5 font-medium text-foreground"><CalendarDays aria-hidden="true" className="size-3.5 text-muted-foreground" /><time dateTime={presentation.publishedOn}>{new Date(`${presentation.publishedOn}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time></dd></div><div><dt className="text-muted-foreground">Based in</dt><dd className="mt-1 flex items-center gap-1.5 font-medium text-foreground"><MapPin aria-hidden="true" className="size-3.5 text-muted-foreground" />{item.freelancer.location_city ?? "Myanmar"}</dd></div><div><dt className="text-muted-foreground">Rating</dt><dd className="mt-1 flex items-center gap-1.5 font-medium text-foreground"><Star aria-hidden="true" className="size-3.5 fill-current text-primary" />{fallbackPresentation ? `${presentation.rating.toFixed(1)} (${presentation.reviewCount})` : "New profile"}</dd></div></dl>;
  const identity = <Link href={`/freelancers/profile/${item.freelancer.id}`} className="mt-4 inline-flex items-center gap-2 rounded-xl text-start focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground" aria-hidden="true">{initials}</span><span><span className="flex items-center gap-1 text-sm font-semibold text-foreground">{freelancerName}{item.freelancer.is_verified ? <BadgeCheck aria-label="Verified freelancer" className="size-3.5 text-primary" /> : null}</span><span className="mt-0.5 block text-xs text-muted-foreground">{item.freelancer.headline ?? "Independent professional"}</span></span></Link>;

  return <article className={cn("mx-auto w-full", mode === "page" && "max-w-5xl")}>
    <div className={cn("grid overflow-hidden rounded-3xl border border-border bg-card shadow-xl", mode === "modal" ? "grid-cols-1 lg:grid-cols-[2fr_3fr]" : "grid-cols-1 lg:grid-cols-[2fr_3fr]")}>
      <section className={cn("flex min-w-0 flex-col p-5 sm:p-7", mode === "modal" ? "gap-3" : "gap-5")} aria-labelledby={mode === "modal" ? undefined : "package-detail-title"}>
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{presentation.role}</p>{mode === "page" ? <h1 id="package-detail-title" className="mt-3 font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">{item.title}</h1> : null}{identity}</div>
        {mode === "modal" ? <p className="mt-2 line-clamp-4 text-sm leading-6 text-muted-foreground">{item.description}</p> : <section aria-labelledby="package-description-heading"><h2 id="package-description-heading" className="font-heading text-lg font-semibold text-foreground">Project description</h2><p className="mt-2 max-w-prose text-base leading-7 text-muted-foreground">{item.description}</p></section>}
        <section aria-labelledby="package-skills-heading"><h2 id="package-skills-heading" className="font-heading text-sm font-semibold text-foreground">Skills and deliverables</h2><ul className="mt-2 flex flex-wrap gap-1.5">{visibleSkills.map((skill) => <li key={skill} className="rounded-lg bg-muted px-2.5 py-1 text-xs text-foreground">{skill}</li>)}</ul></section>
        {context}
        <PackageTierContext presentation={presentation} />
        <PackageReportIssue packageTitle={item.title} />
        <div className="mt-2 flex flex-wrap items-center gap-3"><Button nativeButton={false} size="lg" render={<Link href={`/orders/checkout?packageId=${encodeURIComponent(item.id)}`} />}>Hire this package</Button>{mode === "page" ? <><Button type="button" size="lg" variant="outline">Start a conversation</Button><Link href="/freelancers" className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Back to all services</Link></> : null}</div>
      </section>
      <section className="min-w-0 border-t border-border p-4 sm:p-6 lg:border-s lg:border-t-0" aria-label="Package sample work and related work"><PackageDetailInteractive item={item} presentation={presentation} relatedPackages={related} freelancerName={freelancerName} /></section>
    </div>
  </article>;
}
