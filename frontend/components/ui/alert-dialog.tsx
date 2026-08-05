"use client";

import { AlertDialog as Primitive } from "@base-ui/react/alert-dialog";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const AlertDialog = Primitive.Root;
const AlertDialogTrigger = Primitive.Trigger;
const AlertDialogCancel = Primitive.Close;
const AlertDialogAction = Primitive.Close;
function AlertDialogContent({ className, children, ...props }: ComponentProps<typeof Primitive.Popup>) { return <Primitive.Portal><Primitive.Backdrop className="fixed inset-0 z-50 bg-foreground/40 data-ending-style:opacity-0 data-starting-style:opacity-0" /><Primitive.Popup className={cn("fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6 text-foreground shadow-2xl outline-none", className)} {...props}>{children}</Primitive.Popup></Primitive.Portal>; }
function AlertDialogHeader({ className, ...props }: ComponentProps<"div">) { return <div className={cn("space-y-2", className)} {...props} />; }
function AlertDialogTitle({ className, ...props }: ComponentProps<typeof Primitive.Title>) { return <Primitive.Title className={cn("font-heading text-xl font-semibold", className)} {...props} />; }
function AlertDialogDescription({ className, ...props }: ComponentProps<typeof Primitive.Description>) { return <Primitive.Description className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />; }
function AlertDialogFooter({ className, ...props }: ComponentProps<"div">) { return <div className={cn("mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)} {...props} />; }
export { AlertDialog, AlertDialogTrigger, AlertDialogCancel, AlertDialogAction, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter };
