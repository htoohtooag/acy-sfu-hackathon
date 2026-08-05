"use client";

import { Menu } from "@base-ui/react/menu";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const DropdownMenu = Menu.Root;
const DropdownMenuTrigger = Menu.Trigger;
function DropdownMenuContent({ className, children, align = "start", ...props }: ComponentProps<typeof Menu.Popup> & { align?: "start" | "center" | "end" }) { return <Menu.Portal><Menu.Positioner sideOffset={6} align={align} className="z-50 outline-none"><Menu.Popup className={cn("min-w-44 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none", className)} {...props}>{children}</Menu.Popup></Menu.Positioner></Menu.Portal>; }
function DropdownMenuItem({ className, ...props }: ComponentProps<typeof Menu.Item>) { return <Menu.Item className={cn("flex min-h-10 cursor-default items-center rounded-lg px-3 text-sm outline-none data-highlighted:bg-muted data-highlighted:text-foreground", className)} {...props} />; }
function DropdownMenuSeparator({ className, ...props }: ComponentProps<"div">) { return <div role="separator" className={cn("my-1 h-px bg-border", className)} {...props} />; }
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator };
