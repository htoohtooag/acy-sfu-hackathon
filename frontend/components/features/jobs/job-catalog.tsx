import Link from "next/link";
import type { CatalogJobPostListResponse } from "shared/schemas";

import { JobCard } from "@/components/features/jobs/job-card";

type JobCatalogProps = { result: CatalogJobPostListResponse; search: string; maxBudget: string; basePath?: string };

function pageHref(basePath: string, page: number, search: string, maxBudget: string): string {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (maxBudget) params.set("max_budget_mmk", maxBudget);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function JobCatalog({ result, search, maxBudget, basePath = "/jobs" }: JobCatalogProps) {
  const totalPages = Math.max(1, Math.ceil(result.total / result.page_size));
  return (
    <main id="main-content" className="flex-1 bg-muted/20">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <header className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Find work</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Projects with room for good work.</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">Explore open projects from teams looking for thoughtful, reliable independent talent.</p>
        </header>
        <form action={basePath} className="mb-8 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_14rem_auto] sm:items-end sm:p-5">
          <div className="grid gap-2"><label htmlFor="job-search" className="text-sm font-medium text-foreground">Search projects</label><input id="job-search" name="search" defaultValue={search} placeholder="Try website, branding, or automation" className="min-h-11 rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" /></div>
          <div className="grid gap-2"><label htmlFor="job-budget" className="text-sm font-medium text-foreground">Maximum budget</label><input id="job-budget" name="max_budget_mmk" inputMode="numeric" pattern="[0-9]*" defaultValue={maxBudget} placeholder="500000 MMK" className="min-h-11 rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" /></div>
          <button type="submit" className="min-h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Search</button>
        </form>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground"><strong className="font-semibold text-foreground">{result.total}</strong> open {result.total === 1 ? "project" : "projects"}</p>{search || maxBudget ? <Link href={basePath} className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Clear filters</Link> : null}</div>
        {result.items.length > 0 ? <ul className="grid gap-4" aria-label="Open projects">{result.items.map((job) => <li key={job.id}><JobCard job={job} /></li>)}</ul> : <section className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center"><h2 className="font-heading text-2xl font-semibold text-foreground">No projects match those filters.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Try a broader search or clear the budget limit to see more opportunities.</p><Link href={basePath} className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Browse all projects</Link></section>}
        {totalPages > 1 ? <nav aria-label="Job catalog pagination" className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-5"><div>{result.page > 1 ? <Link href={pageHref(basePath, result.page - 1, search, maxBudget)} className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Previous</Link> : <span />}</div><p className="text-sm text-muted-foreground">Page {result.page} of {totalPages}</p><div>{result.page < totalPages ? <Link href={pageHref(basePath, result.page + 1, search, maxBudget)} className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Next</Link> : <span />}</div></nav> : null}
      </div>
    </main>
  );
}
