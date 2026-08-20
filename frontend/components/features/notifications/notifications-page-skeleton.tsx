import { Skeleton } from "@/components/ui/skeleton";

export function NotificationsPageSkeleton(): React.ReactNode {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-5 sm:p-8 lg:p-10" aria-busy="true" aria-label="Loading notifications">
      <header className="flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-full max-w-lg" />
      </header>
      <section className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-4 sm:p-6">
        <Skeleton className="h-11 w-full" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 w-full rounded-2xl" />)}
        </div>
      </section>
    </div>
  );
}
