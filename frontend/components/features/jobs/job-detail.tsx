import Link from "next/link";
import { CalendarDays, CircleDollarSign, Factory, UserRound } from "lucide-react";
import type { CatalogJobPost } from "shared/schemas";

type JobDetailProps = { job: CatalogJobPost };

function formatMoney(value: string | null): string {
  return value === null ? "Flexible" : `${Number(value).toLocaleString("en-US")} MMK`;
}

function formatBudget(job: CatalogJobPost): string {
  if (job.budget_min_mmk && job.budget_max_mmk) return `${formatMoney(job.budget_min_mmk)} to ${formatMoney(job.budget_max_mmk)}`;
  return formatMoney(job.budget_max_mmk ?? job.budget_min_mmk);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(value));
}

export function JobDetail({ job }: JobDetailProps) {
  const clientName = job.client.company_name ?? job.client.user.full_name ?? "Independent client";
  return (
    <main id="main-content" className="flex-1 bg-muted/20">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <Link href="/jobs" className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">← Back to Find Work</Link>
        <article className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Open project</p><h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{job.title}</h1></div><span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{job.status}</span></div>
            <section className="mt-8 border-t border-border pt-7" aria-labelledby="description-heading"><h2 id="description-heading" className="font-heading text-2xl font-semibold text-foreground">About this project</h2><p className="mt-4 whitespace-pre-wrap text-base leading-8 text-muted-foreground">{job.description}</p></section>
            <section className="mt-8 border-t border-border pt-7" aria-labelledby="client-heading"><h2 id="client-heading" className="font-heading text-2xl font-semibold text-foreground">About the client</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><div className="flex gap-3"><UserRound aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" /><div><dt className="text-xs uppercase tracking-wide text-muted-foreground">Client</dt><dd className="mt-1 font-medium text-foreground">{clientName}</dd></div></div><div className="flex gap-3"><Factory aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" /><div><dt className="text-xs uppercase tracking-wide text-muted-foreground">Industry</dt><dd className="mt-1 font-medium text-foreground">{job.client.industry ?? "Independent business"}</dd></div></div></dl></section>
          </div>
          <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24"><h2 className="font-heading text-xl font-semibold text-foreground">Project snapshot</h2><dl className="mt-5 grid gap-5"><div className="flex gap-3"><CircleDollarSign aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" /><div><dt className="text-xs uppercase tracking-wide text-muted-foreground">Budget</dt><dd className="mt-1 font-medium text-foreground">{formatBudget(job)}</dd></div></div><div className="flex gap-3"><CalendarDays aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" /><div><dt className="text-xs uppercase tracking-wide text-muted-foreground">Expected deadline</dt><dd className="mt-1 font-medium text-foreground">{job.expected_deadline ? formatDate(job.expected_deadline) : "Flexible"}</dd></div></div><div><dt className="text-xs uppercase tracking-wide text-muted-foreground">Posted</dt><dd className="mt-1 font-medium text-foreground"><time dateTime={job.created_at}>{formatDate(job.created_at)}</time></dd></div></dl><button type="button" disabled className="mt-7 min-h-11 w-full cursor-not-allowed rounded-lg bg-muted px-4 text-sm font-semibold text-muted-foreground" aria-disabled="true">Applications coming soon</button><p className="mt-3 text-xs leading-5 text-muted-foreground">Create an account to respond when applications open.</p></aside>
        </article>
      </div>
    </main>
  );
}
