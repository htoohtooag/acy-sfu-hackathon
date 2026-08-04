"use client";

import { CalendarDays, Clock3, Star, WalletCards } from "lucide-react";
import { useState } from "react";

import type { ProfileWorkHistory } from "@/features/catalog/mock-data";

interface FreelancerWorkHistoryProps {
  history: readonly ProfileWorkHistory[];
}

const tabs = ["completed", "in-progress", "related"] as const;
type HistoryTab = (typeof tabs)[number];

export function FreelancerWorkHistory({ history }: FreelancerWorkHistoryProps) {
  const [activeTab, setActiveTab] = useState<HistoryTab>("completed");
  const visibleHistory = activeTab === "completed" ? history.filter((item) => item.status === "completed") : activeTab === "in-progress" ? history.filter((item) => item.status === "in-progress") : [];

  return <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7" aria-labelledby="work-history-heading"><h2 id="work-history-heading" className="sr-only">Freelancer work history</h2><div className="flex flex-wrap gap-5 border-b border-border" role="tablist" aria-label="Work history filters">{tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={`min-h-11 border-b-2 px-0.5 text-sm font-medium capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{tab === "completed" ? `Completed jobs (${history.filter((item) => item.status === "completed").length})` : tab === "in-progress" ? `In progress (${history.filter((item) => item.status === "in-progress").length})` : "Search related"}</button>)}</div>{visibleHistory.length > 0 ? <ul className="divide-y divide-border">{visibleHistory.map((item) => <li key={item.id} className="py-5 first:pt-6"><div className="flex flex-wrap items-start justify-between gap-3"><h3 className="font-medium text-foreground">{item.title}</h3>{item.rating > 0 ? <span className="flex items-center gap-1 text-sm font-medium text-foreground"><Star aria-hidden="true" className="size-3.5 fill-current text-primary" />{item.rating.toFixed(1)}</span> : <span className="text-sm text-muted-foreground">No rating yet</span>}</div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-1"><WalletCards aria-hidden="true" className="size-3.5" />{item.contractType}</span><span>{item.rate}</span><span className="flex items-center gap-1"><CalendarDays aria-hidden="true" className="size-3.5" />{item.dates}</span></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.review === "No public review yet." ? item.review : `"${item.review}"`}</p><ul className="mt-3 flex flex-wrap gap-2">{item.skills.map((skill) => <li key={skill} className="rounded-md bg-muted px-2.5 py-1 text-xs text-foreground">{skill}</li>)}</ul></li>)}</ul> : <div className="flex min-h-36 flex-col items-center justify-center py-8 text-center"><Clock3 aria-hidden="true" className="size-7 text-muted-foreground" /><p className="mt-3 text-sm font-medium text-foreground">No work history in this view yet</p><p className="mt-1 text-sm text-muted-foreground">{activeTab === "related" ? "Related search results will appear here when search is connected." : "This freelancer has no public work in this category yet."}</p></div>}</section>;
}
