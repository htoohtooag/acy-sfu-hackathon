"use client";

import Link from "next/link";
import { Check, ExternalLink, Link2 } from "lucide-react";
import { useState } from "react";
import type { CatalogPackage } from "shared/schemas";

import { PackageDetailClose } from "@/components/features/catalog/package-detail-close";
import { SheetDescription, SheetTitle } from "@/components/ui/sheet";

interface PackageModalHeaderProps {
  item: CatalogPackage;
  freelancerName: string;
}

export function PackageModalHeader({ item, freelancerName }: PackageModalHeaderProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return <header className="flex items-center gap-4 border-b border-border px-5 py-4 sm:px-7"><SheetTitle className="sr-only">{item.title}</SheetTitle><SheetDescription id="package-detail-description" className="sr-only">Review the package details and sample work.</SheetDescription><div className="min-w-0 flex-1"><p className="truncate font-heading text-lg font-semibold text-foreground">{item.title}</p><Link href={`/freelancers/profile/${item.freelancer.id}`} className="mt-1 inline-flex max-w-full items-center gap-1 text-sm text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">View profile: {freelancerName}<ExternalLink aria-hidden="true" className="size-3.5" /></Link></div><button type="button" onClick={copyLink} aria-label={copied ? "Package link copied" : "Copy package link"} className="hidden size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:inline-flex">{copied ? <Check aria-hidden="true" className="size-4 text-primary" /> : <Link2 aria-hidden="true" className="size-4" />}</button><PackageDetailClose /></header>;
}
