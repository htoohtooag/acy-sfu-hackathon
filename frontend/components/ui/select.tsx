"use client";

import { Select as Primitive } from "@base-ui/react/select";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const Select = Primitive.Root;
function SelectTrigger({ className, children, ...props }: ComponentProps<typeof Primitive.Trigger>) { return <Primitive.Trigger className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30", className)} {...props}>{children}<Primitive.Icon className="text-muted-foreground">⌄</Primitive.Icon></Primitive.Trigger>; }
function SelectValue(props: ComponentProps<typeof Primitive.Value>) { return <Primitive.Value {...props} />; }
function SelectContent({ className, children, ...props }: ComponentProps<typeof Primitive.Popup>) { return <Primitive.Portal><Primitive.Positioner sideOffset={4} className="z-50 outline-none"><Primitive.Popup className={cn("min-w-40 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none", className)} {...props}>{children}</Primitive.Popup></Primitive.Positioner></Primitive.Portal>; }
function SelectItem({ className, children, ...props }: ComponentProps<typeof Primitive.Item>) { return <Primitive.Item className={cn("flex min-h-10 cursor-default items-center rounded-lg px-3 text-sm outline-none data-highlighted:bg-muted", className)} {...props}>{children}</Primitive.Item>; }
export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };

