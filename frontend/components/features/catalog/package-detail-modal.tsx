"use client";

import { useRouter } from "next/navigation";
import type { CatalogPackage } from "shared/schemas";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { PackageModalHeader } from "@/components/features/catalog/package-modal-header";
import { PackageDetailContent } from "@/components/features/catalog/package-detail-content";

type PackageDetailModalProps = { item: CatalogPackage };

export function PackageDetailModal({ item }: PackageDetailModalProps) {
  const router = useRouter();

  const freelancerName = item.freelancer.user.full_name ?? "Gigmatch freelancer";

  return <Sheet open onOpenChange={(open) => { if (!open) router.back(); }}><SheetContent aria-describedby="package-detail-description" className="inset-inline-end-auto inset-y-auto start-1/2 top-1/2 h-[min(92vh,56rem)] w-[calc(100%-1rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl p-0 data-ending-style:translate-x-[-50%] data-ending-style:translate-y-[-45%] data-starting-style:translate-x-[-50%] data-starting-style:translate-y-[-55%] sm:w-[calc(100%-2rem)]"><PackageModalHeader item={item} freelancerName={freelancerName} /><div className="min-h-0 overflow-hidden"><PackageDetailContent item={item} mode="modal" /></div></SheetContent></Sheet>;
}
