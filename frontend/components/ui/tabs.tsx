"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn("relative flex items-center gap-1", className)} {...props} />;
}

function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Tab>) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "relative inline-flex min-h-11 flex-1 items-center justify-center rounded-none px-2 text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/50 data-active:text-primary data-active:font-semibold data-active:after:absolute data-active:after:inset-x-1 data-active:after:bottom-0 data-active:after:h-0.5 data-active:after:rounded-full data-active:after:bg-primary data-active:after:content-['']",
        className,
      )}
      {...props}
    />
  );
}

function TabsIndicator({ className, ...props }: ComponentProps<typeof TabsPrimitive.Indicator>) {
  return <TabsPrimitive.Indicator className={cn("absolute bottom-0 h-0.5 rounded-full bg-primary", className)} {...props} />;
}

function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Panel>) {
  return <TabsPrimitive.Panel className={cn("outline-none", className)} {...props} />;
}

export { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger };
