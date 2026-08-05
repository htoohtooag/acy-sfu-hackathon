"use client";

import type { CatalogPackage } from "shared/schemas";
import { Button } from "@/components/ui/button";
import { PackageCard } from "./package-card";

export function PackageGrid({ packages, userId, loading, error, onCreate, onEdit, onToggle, onDelete }: { packages: CatalogPackage[]; userId: string; loading: boolean; error: string | null; onCreate: () => void; onEdit: (item: CatalogPackage) => void; onToggle: (item: CatalogPackage) => void; onDelete: (item: CatalogPackage) => void }): React.ReactNode {
  if (loading) return <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading packages">{[1, 2, 3].map((item) => <div key={item} className="min-h-80 animate-pulse rounded-2xl border border-border bg-muted/40" />)}</div>;
  if (error) return <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive" role="alert">{error}</div>;
  if (packages.length === 0) return <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center sm:p-12"><p className="font-display text-4xl text-primary">Start small</p><h2 className="mt-3 font-heading text-2xl font-semibold">Your best offer is still waiting</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Create a package that makes your strengths easy to buy, then refine it as your practice grows.</p><Button className="mt-6" onClick={onCreate}>Create your first package</Button></section>;
  return <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{packages.map((item) => <PackageCard key={item.id} packageItem={item} owned={item.freelancer.user_id === userId} onEdit={() => onEdit(item)} onToggle={() => onToggle(item)} onDelete={() => onDelete(item)} />)}</div>;
}

