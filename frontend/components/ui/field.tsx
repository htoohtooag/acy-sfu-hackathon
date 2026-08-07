import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function FieldGroup({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex w-full flex-col gap-6", className)} {...props} />;
}

export function Field({ className, ...props }: ComponentProps<"div">) {
  return <div role="group" className={cn("flex w-full flex-col gap-2", className)} {...props} />;
}

export function FieldLabel({ className, ...props }: ComponentProps<typeof Label>) {
  return <Label className={cn("leading-snug", className)} {...props} />;
}

export function FieldDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />;
}

export function FieldError({ className, children, errors, ...props }: ComponentProps<"p"> & {
  errors?: readonly { message?: string }[];
  children?: ReactNode;
}) {
  const message = children ?? errors?.find((error) => error.message)?.message;
  if (!message) return null;
  return <p role="alert" className={cn("text-sm text-destructive", className)} {...props}>{message}</p>;
}

export function FieldSet({ className, ...props }: ComponentProps<"fieldset">) {
  return <fieldset className={cn("flex flex-col gap-4", className)} {...props} />;
}

export function FieldLegend({ className, ...props }: ComponentProps<"legend">) {
  return <legend className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}
