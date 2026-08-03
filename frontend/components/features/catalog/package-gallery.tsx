"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import type { PackageGalleryItem } from "@/features/catalog/mock-data";
import { cn } from "@/lib/utils";

interface PackageGalleryProps {
  items: readonly PackageGalleryItem[];
  packageTitle: string;
}

export function PackageGallery({ items, packageTitle }: PackageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedItem = items[selectedIndex] ?? items[0];

  if (!selectedItem) {
    return <div className="flex aspect-video items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground">Sample work preview unavailable</div>;
  }

  const updateSelection = (nextIndex: number) => {
    setSelectedIndex((nextIndex + items.length) % items.length);
  };

  return (
    <section aria-labelledby="package-gallery-heading" className="space-y-3">
      <h2 id="package-gallery-heading" className="sr-only">Sample work for {packageTitle}</h2>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
        <Image src={selectedItem.imageUrl} alt={selectedItem.alt} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" priority={selectedIndex === 0} />
        {items.length > 1 ? <>
          <button type="button" onClick={() => updateSelection(selectedIndex - 1)} aria-label="Show previous sample work" className="absolute start-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><ChevronLeft aria-hidden="true" className="size-4" /></button>
          <button type="button" onClick={() => updateSelection(selectedIndex + 1)} aria-label="Show next sample work" className="absolute end-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><ChevronRight aria-hidden="true" className="size-4" /></button>
        </> : null}
      </div>
      {items.length > 1 ? <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Sample work slides">
        {items.map((item, index) => <button key={item.id} type="button" onClick={() => setSelectedIndex(index)} aria-label={`Show sample work ${index + 1}`} aria-current={selectedIndex === index ? "true" : undefined} className={cn("relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", selectedIndex === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100")}><Image src={item.imageUrl} alt="" fill sizes="5rem" className="object-cover" /></button>)}
      </div> : null}
    </section>
  );
}
