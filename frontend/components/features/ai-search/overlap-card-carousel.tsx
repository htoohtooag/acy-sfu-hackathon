"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock3, Star } from "lucide-react";
import { useRef } from "react";
import type { CatalogPackage } from "shared/schemas";

import { Button } from "@/components/ui/button";
import { getAiSearchPackagePresentation } from "@/features/ai-search/mock-data";

interface OverlapCardCarouselProps {
  packages: readonly CatalogPackage[];
}

function formatMmk(value: string): string {
  return `${new Intl.NumberFormat("en-US").format(Number(value))} MMK`;
}

export function OverlapCardCarousel({ packages }: OverlapCardCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    scrollerRef.current?.scrollBy({ left: direction === "right" ? 260 : -260, behavior: "smooth" });
  }

  if (packages.length === 0) {
    return <p className="text-sm text-muted-foreground">I could not find a mock recommendation yet.</p>;
  }

  return (
    <section className="flex min-w-0 flex-col gap-3" aria-label="Recommended packages">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Recommended for you</p>
        <div className="flex shrink-0 gap-1">
          <Button type="button" variant="outline" size="icon-sm" aria-label="Scroll recommendations left" onClick={() => scroll("left")}>
            <ArrowLeft aria-hidden="true" data-icon="inline-start" />
          </Button>
          <Button type="button" variant="outline" size="icon-sm" aria-label="Scroll recommendations right" onClick={() => scroll("right")}>
            <ArrowRight aria-hidden="true" data-icon="inline-start" />
          </Button>
        </div>
      </div>
      <div ref={scrollerRef} className="flex min-w-0 snap-x snap-mandatory overflow-x-auto pb-2 pe-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {packages.map((item) => {
          const presentation = getAiSearchPackagePresentation(item.id);
          if (!presentation) return null;

          return (
            <Link
              key={item.id}
              href={`/packages/${item.id}`}
              aria-label={`View ${item.title}`}
              className="group relative -ms-5 flex w-[min(74vw,15rem)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-md transition-transform duration-200 first:ms-0 hover:-translate-y-1 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <div className="relative aspect-[1.45] overflow-hidden bg-muted">
                <Image src={presentation.imageUrl} alt={`${item.title} sample work`} fill sizes="240px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">{item.freelancer.user.full_name ?? "TalentScout freelancer"}</p>
                <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{formatMmk(item.price_mmk)}</span>
                  <span className="inline-flex items-center gap-1" aria-label={`${presentation.rating} rating`}>
                    <Star aria-hidden="true" className="size-3 fill-current text-primary" />
                    {presentation.rating.toFixed(1)}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 aria-hidden="true" className="size-3" />
                  {item.delivery_days} days
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
