import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Empty({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col items-center justify-center text-center", className)} {...props} />;
}

function EmptyHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex max-w-md flex-col items-center gap-3", className)} {...props} />;
}

function EmptyMedia({ className, variant = "default", ...props }: ComponentProps<"div"> & { variant?: "default" | "icon" }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        variant === "icon" && "size-12 rounded-2xl bg-muted text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("font-heading text-xl font-semibold tracking-tight", className)} {...props} />;
}

function EmptyDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("max-w-sm text-sm leading-6 text-muted-foreground", className)} {...props} />;
}

function EmptyContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex items-center justify-center gap-3", className)} {...props} />;
}

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle };
