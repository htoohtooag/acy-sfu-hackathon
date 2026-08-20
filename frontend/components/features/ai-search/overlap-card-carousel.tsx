"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, Clock3, Images } from "lucide-react";
import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import type { AiSearchPackageCard } from "shared/schemas";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OverlapCardCarouselProps {
  packages: readonly AiSearchPackageCard[];
}

const SWIPE_THRESHOLD = 48;
const VISIBLE_STACK_CARDS = 3;

function formatMmk(value: string): string {
  return `${new Intl.NumberFormat("en-US").format(Number(value))} MMK`;
}

function getInitials(name: string): string {
  const initials = name.split(" ").map((part) => part.trim().charAt(0)).filter(Boolean).join("").slice(0, 2).toUpperCase();
  return initials || "TS";
}

interface PackageCardProps {
  item: AiSearchPackageCard;
  isFrontCard: boolean;
  stackPosition: number;
  dragOffset: number;
  onPointerDown?: (event: PointerEvent<HTMLAnchorElement>) => void;
  onPointerMove?: (event: PointerEvent<HTMLAnchorElement>) => void;
  onPointerUp?: (event: PointerEvent<HTMLAnchorElement>) => void;
  onPointerCancel?: () => void;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

function PackageCard({ item, isFrontCard, stackPosition, dragOffset, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClick }: PackageCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const freelancerName = item.freelancer.name ?? "TalentScout freelancer";
  const sampleWork = item.sample_work;
  const showImage = sampleWork !== null && !imageFailed;
  const emptyStateMessage = imageFailed ? "Sample work preview unavailable" : "No sample work uploaded";

  return (
    <Link
      href={`/packages/${item.id}`}
      aria-label={`View ${item.title}`}
      aria-describedby={isFrontCard ? "recommendation-stack-instructions" : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={onClick}
      style={isFrontCard ? { translate: `${dragOffset}px 0` } : undefined}
      className={cn(
        "group absolute inset-x-0 top-0 flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-md transition-[transform,opacity] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
        isFrontCard ? "z-30 cursor-grab touch-pan-y active:cursor-grabbing hover:-translate-y-1" : "pointer-events-none",
        stackPosition === 1 && "z-20 translate-x-2 translate-y-3 rotate-[1.5deg] scale-[0.97] opacity-90",
        stackPosition === 2 && "z-10 translate-x-4 translate-y-6 rotate-[3deg] scale-[0.94] opacity-70",
      )}
    >
      <div className="relative flex aspect-[1.45] items-center justify-center overflow-hidden bg-muted">
        {showImage ? (
          <Image src={sampleWork.image_url} alt={`Sample work: ${sampleWork.title} by ${freelancerName}`} fill sizes="240px" onError={() => setImageFailed(true)} className="object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div role="img" aria-label={`${emptyStateMessage} for ${freelancerName}`} className="flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary/60 px-4 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-background text-sm font-semibold text-foreground shadow-sm">
              {sampleWork === null ? getInitials(freelancerName) : <Images aria-hidden="true" className="size-5" />}
            </span>
            <span className="text-sm font-semibold text-foreground">{emptyStateMessage}</span>
            <span className="text-xs text-muted-foreground">View profile for more work</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{item.title}</p>
        <p className="truncate text-xs text-muted-foreground">{freelancerName}</p>
        {item.freelancer.headline || item.freelancer.city ? <p className="line-clamp-1 text-xs text-muted-foreground">{[item.freelancer.headline, item.freelancer.city].filter(Boolean).join(" · ")}</p> : null}
        <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{formatMmk(item.price_mmk)}</span>
          <span>{item.tier?.display_name ?? item.tier?.name ?? "Service"}</span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock3 aria-hidden="true" className="size-3" />{item.delivery_days} days</span>
        {item.freelancer.is_verified ? <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><BadgeCheck aria-hidden="true" className="size-3" /> Verified freelancer</span> : null}
      </div>
    </Link>
  );
}

export function OverlapCardCarousel({ packages }: OverlapCardCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const pointerStartXRef = useRef<number | null>(null);
  const didSwipeRef = useRef(false);

  function changeActiveCard(direction: "previous" | "next"): void {
    setActiveIndex((currentIndex) => {
      const offset = direction === "next" ? 1 : -1;
      return (currentIndex + offset + packages.length) % packages.length;
    });
  }

  function handlePointerDown(event: PointerEvent<HTMLAnchorElement>): void {
    pointerStartXRef.current = event.clientX;
    didSwipeRef.current = false;
    setDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLAnchorElement>): void {
    if (pointerStartXRef.current === null) return;

    setDragOffset(event.clientX - pointerStartXRef.current);
  }

  function handlePointerEnd(event: PointerEvent<HTMLAnchorElement>): void {
    const pointerStartX = pointerStartXRef.current;
    pointerStartXRef.current = null;
    setDragOffset(0);

    if (pointerStartX === null) return;

    const horizontalDistance = event.clientX - pointerStartX;
    if (Math.abs(horizontalDistance) < SWIPE_THRESHOLD) return;

    didSwipeRef.current = true;
    changeActiveCard(horizontalDistance < 0 ? "next" : "previous");
  }

  function handlePointerCancel(): void {
    pointerStartXRef.current = null;
    setDragOffset(0);
  }

  function handleCardClick(event: MouseEvent<HTMLAnchorElement>): void {
    if (!didSwipeRef.current) return;

    event.preventDefault();
    didSwipeRef.current = false;
  }

  if (packages.length === 0) {
    return <p className="text-sm text-muted-foreground">No matching packages found.</p>;
  }

  const safeActiveIndex = activeIndex % packages.length;
  const stackedPackages = Array.from(
    { length: Math.min(packages.length, VISIBLE_STACK_CARDS) },
    (_, stackPosition) => ({
      item: packages[(safeActiveIndex + stackPosition) % packages.length],
      stackPosition,
    }),
  );

  return (
    <section className="flex min-w-0 flex-col gap-3" aria-label="Recommended packages">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Recommended for you</p>
        <div className="flex shrink-0 gap-1">
          <Button type="button" variant="outline" size="icon-sm" aria-label="Show previous recommendation" onClick={() => changeActiveCard("previous")}>
            <ArrowLeft aria-hidden="true" data-icon="inline-start" />
          </Button>
          <Button type="button" variant="outline" size="icon-sm" aria-label="Show next recommendation" onClick={() => changeActiveCard("next")}>
            <ArrowRight aria-hidden="true" data-icon="inline-start" />
          </Button>
        </div>
      </div>
      <div className="flex justify-center">
        <div className="relative h-[23.5rem] w-full max-w-[17rem]">
          {[...stackedPackages].reverse().map(({ item, stackPosition }) => {
            const isFrontCard = stackPosition === 0;

            return (
              <PackageCard
                key={item.id}
                item={item}
                isFrontCard={isFrontCard}
                stackPosition={stackPosition}
                dragOffset={dragOffset}
                onPointerDown={isFrontCard ? handlePointerDown : undefined}
                onPointerMove={isFrontCard ? handlePointerMove : undefined}
                onPointerUp={isFrontCard ? handlePointerEnd : undefined}
                onPointerCancel={isFrontCard ? handlePointerCancel : undefined}
                onClick={isFrontCard ? handleCardClick : undefined}
              />
            );
          })}
        </div>
      </div>
      <p id="recommendation-stack-instructions" className="sr-only">Swipe the front recommendation left or right to browse. Select a recommendation to view its details.</p>
      {packages.length > 1 ? (
        <div className="flex justify-center gap-1.5" aria-label="Choose a recommendation">
          {packages.map((item, index) => (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Show recommendation ${index + 1}: ${item.title}`}
              aria-current={index === safeActiveIndex ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none",
                index === safeActiveIndex ? "w-6 bg-primary hover:bg-primary/80" : "bg-muted hover:bg-secondary",
              )}
            >
              <span className="sr-only">{index + 1}</span>
            </Button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
