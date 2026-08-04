import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Clock3, Heart, RotateCcw, Star } from "lucide-react";
import type { CatalogPackage } from "shared/schemas";

import { catalogPackagePresentation } from "@/features/catalog/mock-data";
import { formatMmk } from "@/features/catalog/catalog-data";
import { cn } from "@/lib/utils";

type CatalogResultCardProps = { item: CatalogPackage; index: number };

const visualToneClasses = {
  primary: "from-primary/20 via-primary/5 to-muted",
  secondary: "from-secondary via-muted to-primary/10",
  accent: "from-accent via-primary/5 to-muted",
} as const;

export function CatalogResultCard({ item, index }: CatalogResultCardProps) {
  const presentation = catalogPackagePresentation[item.id];
  const freelancerName = item.freelancer.user.full_name ?? "TalentScout freelancer";
  const initials = freelancerName.split(" ").map((part) => part[0]).join("").slice(0, 2);

  return (
    <article className="group relative overflow-hidden border-b border-border pb-6 transition-colors hover:border-primary/50">
      <div className="grid items-stretch gap-0 md:grid-cols-[minmax(13rem,28%)_1fr]">
        <Link href={`/freelancers/${item.id}`} aria-label={`Open package details for ${item.title}`} className={cn("relative block min-h-56 overflow-hidden bg-gradient-to-br focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring md:min-h-64", visualToneClasses[presentation?.visualTone ?? "primary"])}>
          {presentation?.imageUrl ? <Image src={presentation.imageUrl} alt={`Sample work from ${freelancerName}`} fill sizes="(min-width: 768px) 28vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" priority={index < 2} /> : <div className="absolute inset-0 menu-pattern" aria-hidden="true" />}
          <div className="absolute inset-0 bg-foreground/10" aria-hidden="true" />
          <span className="absolute bottom-3 start-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground">Sample work</span>
        </Link>
        <div className="flex flex-col gap-5 px-0 py-5 md:px-6 md:py-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href={`/freelancers/profile/${item.freelancer.id}`} aria-label={`View ${freelancerName}'s profile`} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">{initials}</Link>
              <Link href={`/freelancers/profile/${item.freelancer.id}`} className="min-w-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><p className="flex items-center gap-1 text-sm font-medium text-foreground">{freelancerName}{item.freelancer.is_verified ? <BadgeCheck aria-label="Verified freelancer" className="size-4 text-primary" /> : null}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.freelancer.headline ?? "Independent professional"}</p></Link>
            </div>
            <button type="button" aria-label={`Save ${item.title}`} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><Heart aria-hidden="true" className="size-5" /></button>
          </div>
          <div>
            <Link href={`/freelancers/${item.id}`} className="font-heading text-xl font-semibold leading-tight text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{item.title}</Link>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
          </div>
          <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><Star aria-hidden="true" className="size-4 fill-current text-primary" /><dt className="sr-only">Rating</dt><dd>{presentation ? `${presentation.rating.toFixed(1)} (${presentation.reviewCount})` : "New profile"}</dd></div>
            <div className="flex items-center gap-1.5"><Clock3 aria-hidden="true" className="size-4" /><dt className="sr-only">Delivery</dt><dd>{item.delivery_days} days</dd></div>
            <div className="flex items-center gap-1.5"><RotateCcw aria-hidden="true" className="size-4" /><dt className="sr-only">Revisions</dt><dd>{presentation?.revisions ?? "Details on request"}</dd></div>
          </dl>
          <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-border pt-4">
            <div><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Starting at</p><p className="mt-1 font-heading text-xl font-semibold text-primary"><data value={item.price_mmk}>{formatMmk(item.price_mmk)}</data></p></div>
            <Link href={`/freelancers/${item.id}`} className="text-sm font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">View package</Link>
          </div>
        </div>
      </div>
    </article>
  );
}
