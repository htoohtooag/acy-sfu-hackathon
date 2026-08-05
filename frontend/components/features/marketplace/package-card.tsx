"use client";

import { Check, MoreHorizontal, Pause, Pencil, Play, Trash2 } from "lucide-react";
import type { CatalogPackage } from "shared/schemas";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function PackageCard({ packageItem, owned, onEdit, onToggle, onDelete }: { packageItem: CatalogPackage; owned: boolean; onEdit: () => void; onToggle: () => void; onDelete: () => void }): React.ReactNode {
  const visibleFeatures = packageItem.features.slice(0, 3);
  const extraFeatures = packageItem.features.length - visibleFeatures.length;
  return <article className="group relative flex min-h-80 flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-lg"><div className="mb-8 flex items-start justify-between gap-4"><div className="space-y-3"><Badge className="bg-accent text-accent-foreground">{packageItem.tier?.display_name ?? packageItem.tier?.name ?? "Custom offer"}</Badge><h2 className="max-w-[18ch] font-heading text-xl font-semibold leading-tight tracking-tight">{packageItem.title}</h2></div>{owned ? <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Actions for ${packageItem.title}`}><MoreHorizontal aria-hidden="true" /></Button>} /><DropdownMenuContent align="end"><DropdownMenuItem onClick={onEdit}><Pencil aria-hidden="true" />Edit package</DropdownMenuItem><DropdownMenuItem onClick={onToggle}>{packageItem.is_active ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}{packageItem.is_active ? "Pause package" : "Activate package"}</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onClick={onDelete}><Trash2 aria-hidden="true" />Delete package</DropdownMenuItem></DropdownMenuContent></DropdownMenu> : null}</div><div className="flex items-end justify-between gap-4 border-b border-border pb-5"><div><p className="font-mono text-3xl font-semibold tracking-tight">{Number(packageItem.price_mmk).toLocaleString("en-US")} <span className="text-sm font-medium text-muted-foreground">MMK</span></p><p className="mt-1 text-sm text-muted-foreground">{packageItem.delivery_days} day delivery</p></div><Badge className={packageItem.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>{packageItem.is_active ? "Active" : "Paused"}</Badge></div><ul className="mt-5 space-y-3 text-sm text-muted-foreground">{visibleFeatures.map((feature) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>{feature}</span></li>)}</ul>{extraFeatures > 0 ? <p className="mt-auto pt-4 text-xs font-medium text-primary">+{extraFeatures} more feature{extraFeatures === 1 ? "" : "s"}</p> : null}</article>;
}

