"use client";

import * as React from "react";
import { Accordion } from "@base-ui/react/accordion";

import { cn } from "@/lib/utils";

const AccordionRoot = Accordion.Root;

function AccordionItem({ className, ...props }: React.ComponentProps<typeof Accordion.Item>) {
  return <Accordion.Item className={cn("border-b border-border", className)} {...props} />;
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof Accordion.Trigger>) {
  return (
    <Accordion.Header>
      <Accordion.Trigger
        className={cn(
          "group flex min-h-12 w-full items-center justify-between gap-4 py-3 text-start text-base font-medium transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          className,
        )}
        {...props}
      >
        {children}
      </Accordion.Trigger>
    </Accordion.Header>
  );
}

function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof Accordion.Panel>) {
  return (
    <Accordion.Panel
      className={cn(
        "h-[var(--accordion-panel-height)] overflow-hidden text-sm text-muted-foreground transition-[height] duration-200 data-ending-style:h-0 data-starting-style:h-0",
        className,
      )}
      {...props}
    >
      <div className="pb-4">{children}</div>
    </Accordion.Panel>
  );
}

export {
  AccordionRoot as Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
};
