"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
function DialogContent({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Popup>) { return <DialogPrimitive.Portal><DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/40 data-ending-style:opacity-0 data-starting-style:opacity-0" /><DialogPrimitive.Popup className={cn("fixed left-1/2 top-1/2 z-50 max-h-[min(90vh,48rem)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-background p-6 text-foreground shadow-2xl outline-none data-ending-style:opacity-0 data-starting-style:opacity-0 sm:p-8", className)} {...props}>{children}</DialogPrimitive.Popup></DialogPrimitive.Portal>; }
function DialogHeader({ className, ...props }: ComponentProps<"div">) { return <div className={cn("mb-6 space-y-2", className)} {...props} />; }
function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) { return <DialogPrimitive.Title className={cn("font-heading text-2xl font-semibold tracking-tight", className)} {...props} />; }
function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) { return <DialogPrimitive.Description className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />; }
function DialogFooter({ className, ...props }: ComponentProps<"div">) { return <div className={cn("mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)} {...props} />; }
export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
