import Link from "next/link";
import { CalendarDays, CircleDollarSign, UserRound } from "lucide-react";
import type { CatalogJobPost } from "shared/schemas";

type JobCardProps = { job: CatalogJobPost };

function formatMoney(value: string | null): string {
  return value === null ? "Flexible budget" : `${Number(value).toLocaleString("en-US")} MMK`;
}

function formatBudget(job: CatalogJobPost): string {
  if (job.budget_min_mmk && job.budget_max_mmk) return `${formatMoney(job.budget_min_mmk)} to ${formatMoney(job.budget_max_mmk)}`;
  return formatMoney(job.budget_max_mmk ?? job.budget_min_mmk);
}

function formatDeadline(value: string | null): string {
  if (value === null) return "Deadline flexible";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

export function JobCard({ job }: JobCardProps) {
  const clientName = job.client.company_name ?? job.client.user.full_name ?? "Independent client";
  return (
    <article className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/50 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Open project</p>
          <h2 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            <Link href={`/jobs/${job.id}`} className="rounded-sm underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
              {job.title}
            </Link>
          </h2>
        </div>
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{job.status}</span>
      </div>
      <p className="mt-4 line-clamp-3 max-w-3xl text-sm leading-7 text-muted-foreground">{job.description}</p>
      <dl className="mt-5 grid gap-3 border-t border-border pt-4 text-sm text-muted-foreground sm:grid-cols-3">
        <div className="flex items-start gap-2"><CircleDollarSign aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" /><div><dt className="text-xs uppercase tracking-wide">Budget</dt><dd className="mt-1 font-medium text-foreground">{formatBudget(job)}</dd></div></div>
        <div className="flex items-start gap-2"><CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" /><div><dt className="text-xs uppercase tracking-wide">Deadline</dt><dd className="mt-1 font-medium text-foreground">{formatDeadline(job.expected_deadline)}</dd></div></div>
        <div className="flex items-start gap-2"><UserRound aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" /><div><dt className="text-xs uppercase tracking-wide">Posted by</dt><dd className="mt-1 font-medium text-foreground">{clientName}</dd></div></div>
      </dl>
      <Link href={`/jobs/${job.id}`} className="mt-5 inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">View project details <span aria-hidden="true" className="ms-2">→</span></Link>
    </article>
  );
}
