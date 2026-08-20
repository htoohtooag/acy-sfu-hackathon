import type { Metadata } from "next";
import Link from "next/link";

import { JobCatalog } from "@/components/features/jobs/job-catalog";
import { getJobs, type JobListQuery } from "@/features/jobs/job-data";

export const metadata: Metadata = {
  title: "Find Work | Gigmatch",
  description: "Find open freelance projects from teams looking for thoughtful, reliable independent talent.",
  openGraph: { title: "Find Work | Gigmatch", description: "Explore open freelance projects on Gigmatch." },
};

type SearchParamValue = string | string[] | undefined;
type JobsPageProps = { searchParams: Promise<Record<string, SearchParamValue>> };

function first(value: SearchParamValue): string { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }
function positiveInteger(value: string, fallback: number, max: number): number { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback; }
function money(value: string): string { return /^[0-9]+$/.test(value) ? value : ""; }

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams;
  const search = first(params.search).trim().slice(0, 255);
  const maxBudget = money(first(params.max_budget_mmk));
  const query: JobListQuery = { page: positiveInteger(first(params.page), 1, 100000), page_size: positiveInteger(first(params.page_size), 20, 50), search: search || undefined, max_budget_mmk: maxBudget || undefined };
  const result = await getJobs(query).catch(() => null);
  if (result === null) {
    return <main id="main-content" className="flex-1 bg-muted/20"><div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Find work</p><h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-foreground">Projects are taking a quick pause.</h1><p className="mt-4 text-base leading-7 text-muted-foreground">We could not load the latest opportunities right now. Please try again shortly.</p><Link href="/jobs" className="mt-7 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Try again</Link></div></main>;
  }
  return <JobCatalog result={result} search={search} maxBudget={maxBudget} />;
}
