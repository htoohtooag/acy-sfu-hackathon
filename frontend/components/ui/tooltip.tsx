"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { cn } from "@/lib/utils";

const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

function TooltipContent({ className, ...props }: React.ComponentProps<typeof TooltipPrimitive.Popup>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner side="right" sideOffset={10} className="z-[60]">
        <TooltipPrimitive.Popup className={cn("rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-md", className)} {...props} />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipTrigger };
