"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

type PackageDetailCloseProps = { label?: string };

export function PackageDetailClose({ label = "Close package details" }: PackageDetailCloseProps) {
  const router = useRouter();

  return (
    <button type="button" aria-label={label} onClick={() => router.back()} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      <X aria-hidden="true" className="size-5" />
    </button>
  );
}
