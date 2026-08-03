"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";

import type { CatalogPackage } from "shared/schemas";
import { catalogPackagePresentation } from "@/features/catalog/mock-data";

interface PackageRelatedCarouselProps {
  packages: CatalogPackage[];
  freelancerName: string;
}

export function PackageRelatedCarousel({ packages, freelancerName }: PackageRelatedCarouselProps) {
  const listRef = useRef<HTMLUListElement>(null);
  if (packages.length === 0) return null;

  const scroll = (direction: "previous" | "next") => {
    listRef.current?.scrollBy({ left: direction === "next" ? 280 : -280, behavior: "smooth" });
  };

  return (
    <section aria-labelledby="related-packages-heading" className="border-t border-border pt-4">
      <div className="flex items-center justify-between gap-3"><h2 id="related-packages-heading" className="font-heading text-sm font-semibold text-foreground">More by {freelancerName}</h2><div className="flex gap-1"><button type="button" onClick={() => scroll("previous")} aria-label="Show previous related packages" className="inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><ArrowLeft aria-hidden="true" className="size-3.5" /></button><button type="button" onClick={() => scroll("next")} aria-label="Show next related packages" className="inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><ArrowRight aria-hidden="true" className="size-3.5" /></button></div></div>
      <ul ref={listRef} className="mt-4 flex snap-x gap-4 overflow-x-auto pb-2" aria-label={`Other packages by ${freelancerName}`}>
        {packages.map((item) => { const presentation = catalogPackagePresentation[item.id]; return <li key={item.id} className="w-32 shrink-0 snap-start"><Link href={`/freelancers/${item.id}`} className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"><span className="relative block aspect-[1.4] overflow-hidden rounded-lg bg-muted"><Image src={presentation.imageUrl} alt={`Sample work for ${item.title}`} fill sizes="8rem" className="object-cover transition-transform duration-300 group-hover:scale-105" /></span><span className="mt-1.5 block line-clamp-2 text-xs font-medium text-foreground group-hover:text-primary">{item.title}</span></Link></li>; })}
      </ul>
    </section>
  );
}
