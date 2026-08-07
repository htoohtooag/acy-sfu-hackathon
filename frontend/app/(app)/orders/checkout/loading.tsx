import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return <main className="flex-1 bg-muted/20 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16"><div className="mx-auto flex w-full max-w-6xl flex-col gap-8"><Skeleton className="h-20 w-full max-w-2xl" /><div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-96 w-full" /><Skeleton className="h-[32rem] w-full" /></div></div></main>;
}
