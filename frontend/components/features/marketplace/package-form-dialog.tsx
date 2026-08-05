"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createPackageSchema, updatePackageSchema, type CatalogPackage, type CreatePackageRequest, type UpdatePackageRequest } from "shared/schemas";

import { Button } from "@/components/ui/button";
import { usePackageTiers } from "@/features/marketplace/marketplace-api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PackageFormValues = CreatePackageRequest;

export function PackageFormDialog({ open, packageItem, pending, onOpenChange, onSubmit }: { open: boolean; packageItem: CatalogPackage | null; pending: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: CreatePackageRequest | UpdatePackageRequest) => void }): React.ReactNode {
  const editing = packageItem !== null;
  const [featureText, setFeatureText] = useState("");
  const tiersQuery = usePackageTiers(open);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PackageFormValues>({ resolver: zodResolver(createPackageSchema), defaultValues: { title: "", description: "", price_mmk: "", delivery_days: 1, tier_id: null, features: [] } });
  const features = watch("features") ?? [];
  const tiers = tiersQuery.data ?? [];
  const currentTier = packageItem?.tier;
  const availableTiers = currentTier && !tiers.some((tier) => tier.id === currentTier.id)
    ? [...tiers, { id: currentTier.id, name: currentTier.name, display_name: currentTier.display_name, sort_order: tiers.length }]
    : tiers;
  const selectedTierId = watch("tier_id");
  const selectedTier = availableTiers.find((tier) => tier.id === selectedTierId);
  const selectedTierLabel = selectedTier?.display_name ?? selectedTier?.name ?? "No tier selected";

  useEffect(() => {
    reset(packageItem ? { title: packageItem.title, description: packageItem.description ?? "", price_mmk: packageItem.price_mmk, delivery_days: packageItem.delivery_days, tier_id: packageItem.tier_id, features: packageItem.features } : { title: "", description: "", price_mmk: "", delivery_days: 1, tier_id: null, features: [] });
    setFeatureText("");
  }, [packageItem, reset, open]);

  function addFeature(): void {
    const feature = featureText.trim();
    if (feature && !features.includes(feature)) setValue("features", [...features, feature], { shouldDirty: true });
    setFeatureText("");
  }

  function removeFeature(feature: string): void { setValue("features", features.filter((item) => item !== feature), { shouldDirty: true }); }

  function submit(values: PackageFormValues): void {
    if (editing) {
      const parsed = updatePackageSchema.safeParse(values);
      if (parsed.success) onSubmit(parsed.data);
      return;
    }
    const parsed = createPackageSchema.safeParse(values);
    if (parsed.success) onSubmit(parsed.data);
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{editing ? "Refine your package" : "Create a package"}</DialogTitle><DialogDescription>Turn your expertise into a clear offer clients can understand at a glance.</DialogDescription></DialogHeader><form className="space-y-5" onSubmit={(event) => { void handleSubmit(submit)(event); }}><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label htmlFor="package-title">Title</Label><Input id="package-title" {...register("title")} placeholder="Brand identity starter kit" aria-invalid={Boolean(errors.title)} />{errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}</div><div className="space-y-2 sm:col-span-2"><Label htmlFor="package-description">Description</Label><Textarea id="package-description" {...register("description")} placeholder="Describe the outcome clients can expect." aria-invalid={Boolean(errors.description)} />{errors.description ? <p className="text-xs text-destructive">{errors.description.message}</p> : null}</div><div className="space-y-2"><Label htmlFor="package-price">Price in MMK</Label><Input id="package-price" inputMode="numeric" {...register("price_mmk")} placeholder="150000" aria-invalid={Boolean(errors.price_mmk)} />{errors.price_mmk ? <p className="text-xs text-destructive">Use a positive whole number.</p> : null}</div><div className="space-y-2"><Label htmlFor="package-delivery">Delivery days</Label><Input id="package-delivery" type="number" min="1" {...register("delivery_days", { valueAsNumber: true })} aria-invalid={Boolean(errors.delivery_days)} />{errors.delivery_days ? <p className="text-xs text-destructive">Enter at least one day.</p> : null}</div><div className="space-y-2 sm:col-span-2"><Label htmlFor="package-tier">Tier</Label><Select value={selectedTierId ?? "none"} onValueChange={(value) => setValue("tier_id", value === "none" ? null : value, { shouldDirty: true })}><SelectTrigger id="package-tier" disabled={tiersQuery.isPending}><SelectValue>{tiersQuery.isPending ? "Loading tiers…" : selectedTierLabel}</SelectValue></SelectTrigger><SelectContent><SelectItem value="none">No tier selected</SelectItem>{availableTiers.map((tier) => <SelectItem key={tier.id} value={tier.id}>{tier.display_name ?? tier.name}</SelectItem>)}</SelectContent></Select>{tiersQuery.isError ? <p className="text-xs text-destructive">Tiers could not be loaded. You can continue without selecting one.</p> : <p className="text-xs text-muted-foreground">Choose an active marketplace tier for this offer.</p>}</div><div className="space-y-2 sm:col-span-2"><Label htmlFor="package-feature-input">Features</Label><div className="flex gap-2"><Input id="package-feature-input" value={featureText} onChange={(event) => setFeatureText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addFeature(); } }} placeholder="Press Enter to add a feature" /><Button type="button" variant="outline" onClick={addFeature}>Add</Button></div><div className="flex min-h-10 flex-wrap gap-2 rounded-lg border border-border bg-muted/30 p-2" aria-live="polite">{features.length > 0 ? features.map((feature) => <span key={feature} className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">{feature}<button type="button" onClick={() => removeFeature(feature)} aria-label={`Remove ${feature}`} className="rounded-full px-1 hover:bg-accent-foreground/10">×</button></span>) : <span className="px-1 py-1 text-xs text-muted-foreground">No features added yet.</span>}</div></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={pending}>{pending ? "Saving…" : editing ? "Save changes" : "Create package"}</Button></DialogFooter></form></DialogContent></Dialog>;
}
