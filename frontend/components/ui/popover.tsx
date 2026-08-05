"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

function PopoverContent({ className, children, ...props }: React.ComponentProps<typeof PopoverPrimitive.Popup>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner side="right" align="start" sideOffset={10} className="z-50 outline-none">
        <PopoverPrimitive.Popup className={cn("rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg outline-none", className)} {...props}>{children}</PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
