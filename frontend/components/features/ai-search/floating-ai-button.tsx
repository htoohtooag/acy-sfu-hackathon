"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronUp } from "lucide-react";

import { AiSearchDialog } from "@/components/features/ai-search/ai-search-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { aiAssistantIdentity } from "@/features/ai-search/mock-data";

const aiSearchPathPrefixes = ["/dashboard", "/orders", "/posts", "/notifications"] as const;
const aiSearchExcludedPaths = ["/orders/checkout"] as const;

function isAiSearchPath(pathname: string | null): boolean {
  if (aiSearchExcludedPaths.some((path) => pathname === path || pathname?.startsWith(`${path}/`))) return false;
  return aiSearchPathPrefixes.some((prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`));
}

export function FloatingAiButton() {
  const pathname = usePathname();
  if (!isAiSearchPath(pathname)) return null;

  return <FloatingAiButtonContent key={pathname} />;
}

function FloatingAiButtonContent() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            aria-label="Open Indy AI assistant"
            aria-haspopup="dialog"
            className="fixed end-4 bottom-4 z-40 flex h-auto min-h-16 w-[min(23rem,calc(100vw-2rem))] justify-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-start text-foreground shadow-xl hover:bg-card sm:end-6 sm:bottom-6"
          />
        }
      >
        <Avatar size="sm" aria-hidden="true">
          <AvatarFallback className="bg-primary-foreground text-primary">{aiAssistantIdentity.initials}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            {aiAssistantIdentity.name}
            <Badge>AI</Badge>
          </span>
          <span className="truncate text-xs font-normal text-muted-foreground">What are you looking for today?</span>
        </span>
        <ChevronUp aria-hidden="true" data-icon="inline-end" />
      </DialogTrigger>
      <AiSearchDialog />
    </Dialog>
  );
}
