import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MarketplaceToastKind = "success" | "error";

export function MarketplaceToast({ message, kind }: { message: string; kind: MarketplaceToastKind }): ReactNode {
  return <div className={cn("fixed inset-x-4 bottom-5 z-[70] mx-auto max-w-md rounded-xl border px-4 py-3 text-sm font-medium shadow-xl sm:inset-x-auto sm:right-6", kind === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-primary")} role={kind === "error" ? "alert" : "status"}>{message}</div>;
}

