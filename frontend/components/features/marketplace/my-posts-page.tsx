"use client";

import { useState } from "react";
import { createJobPostSchema, createPackageSchema, type CatalogJobPost, type CatalogPackage, type CreateJobPostRequest, type CreatePackageRequest, type JobPostStatus, type UpdateJobPostRequest, type UpdatePackageRequest, updateJobPostSchema, updatePackageSchema } from "shared/schemas";

import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/app/app-api";
import { ApiRequestError } from "@/lib/api-client";
import { useAppStore } from "@/store/use-app-store";
import { useCreateJob, useCreatePackage, useDeleteJob, useDeletePackage, useMyJobs, useMyPackages, useUpdateJob, useUpdatePackage } from "@/features/marketplace/marketplace-api";
import { DeleteRecordAlertDialog } from "./delete-record-alert-dialog";
import { JobPostFormDialog } from "./job-post-form-dialog";
import { JobPostsTable } from "./job-posts-table";
import { MarketplaceToast, type MarketplaceToastKind } from "./marketplace-toast";
import { PackageFormDialog } from "./package-form-dialog";
import { PackageGrid } from "./package-grid";

type DeleteTarget = { kind: "package"; item: CatalogPackage } | { kind: "job"; item: CatalogJobPost } | null;

function messageFromError(error: unknown): string { return error instanceof ApiRequestError ? error.message : error instanceof Error ? error.message : "Something went wrong. Try again."; }

export function MyPostsPage(): React.ReactNode {
  const activeRole = useAppStore((state) => state.activeRole);
  const { data: user } = useCurrentUser();
  const packagesQuery = useMyPackages(activeRole === "FREELANCER");
  const jobsQuery = useMyJobs(activeRole === "CLIENT");
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const deletePackage = useDeletePackage();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CatalogPackage | null>(null);
  const [editingJob, setEditingJob] = useState<CatalogJobPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [toast, setToast] = useState<{ message: string; kind: MarketplaceToastKind } | null>(null);
  const userId = user?.id ?? "";

  function showToast(message: string, kind: MarketplaceToastKind = "success"): void { setToast({ message, kind }); window.setTimeout(() => setToast(null), 4200); }
  function openCreatePackage(): void { setEditingPackage(null); setPackageDialogOpen(true); }
  function openEditPackage(item: CatalogPackage): void { setEditingPackage(item); setPackageDialogOpen(true); }
  function openCreateJob(): void { setEditingJob(null); setJobDialogOpen(true); }
  function openEditJob(item: CatalogJobPost): void { setEditingJob(item); setJobDialogOpen(true); }

  function submitPackage(data: CreatePackageRequest | UpdatePackageRequest): void {
    if (editingPackage) {
      const parsed = updatePackageSchema.safeParse(data);
      if (!parsed.success) { showToast("Please check the package fields.", "error"); return; }
      updatePackage.mutate({ id: editingPackage.id, data: parsed.data }, { onSuccess: () => { setPackageDialogOpen(false); showToast("Package updated."); }, onError: (error) => showToast(messageFromError(error), "error") });
      return;
    }
    const parsed = createPackageSchema.safeParse(data);
    if (!parsed.success) { showToast("Please check the package fields.", "error"); return; }
    createPackage.mutate(parsed.data, { onSuccess: () => { setPackageDialogOpen(false); showToast("Package created."); }, onError: (error) => showToast(messageFromError(error), "error") });
  }

  function togglePackage(item: CatalogPackage): void {
    if (!item.is_active) {
      const activeCount = (packagesQuery.data?.items ?? []).filter((candidate) => candidate.freelancer.user_id === userId && candidate.is_active).length;
      if (activeCount >= 3) { showToast("Active package limit reached. Upgrade to activate more.", "error"); return; }
    }
    updatePackage.mutate({ id: item.id, data: { is_active: !item.is_active } }, { onSuccess: () => showToast(item.is_active ? "Package paused." : "Package activated."), onError: (error) => showToast(messageFromError(error), "error") });
  }

  function submitJob(data: CreateJobPostRequest | UpdateJobPostRequest): void {
    if (editingJob) {
      const parsed = updateJobPostSchema.safeParse(data);
      if (!parsed.success) { showToast("Please check the job post fields.", "error"); return; }
      updateJob.mutate({ id: editingJob.id, data: parsed.data }, { onSuccess: () => { setJobDialogOpen(false); showToast("Job post updated."); }, onError: (error) => showToast(messageFromError(error), "error") });
      return;
    }
    const parsed = createJobPostSchema.safeParse(data);
    if (!parsed.success) { showToast("Please check the job post fields.", "error"); return; }
    createJob.mutate(parsed.data, { onSuccess: () => { setJobDialogOpen(false); showToast("Job post published."); }, onError: (error) => showToast(messageFromError(error), "error") });
  }

  function toggleJob(job: CatalogJobPost, status: JobPostStatus): void {
    updateJob.mutate({ id: job.id, data: { status } }, { onSuccess: () => showToast(status === "OPEN" ? "Job post reopened." : "Job post closed."), onError: (error) => showToast(messageFromError(error), "error") });
  }

  function confirmDelete(): void {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "package") deletePackage.mutate(deleteTarget.item.id, { onSuccess: () => { setDeleteTarget(null); showToast("Package deleted."); }, onError: (error) => showToast(messageFromError(error), "error") });
    else deleteJob.mutate(deleteTarget.item.id, { onSuccess: () => { setDeleteTarget(null); showToast("Job post deleted."); }, onError: (error) => showToast(messageFromError(error), "error") });
  }

  const ownPackages = (packagesQuery.data?.items ?? []).filter((item) => item.freelancer.user_id === userId);
  const ownJobs = (jobsQuery.data?.items ?? []).filter((item) => item.client.user_id === userId);
  const isPackagePending = createPackage.isPending || updatePackage.isPending;
  const isJobPending = createJob.isPending || updateJob.isPending;
  const pageTitle = activeRole === "FREELANCER" ? "My packages" : "My job posts";
  const pageDescription = activeRole === "FREELANCER" ? "Shape a small shelf of offers that makes your best work easy to choose." : "Keep your briefs clear, current, and ready for the right freelancer.";

  return <div id="main-content" className="mx-auto w-full max-w-7xl space-y-8 p-5 sm:p-8 lg:p-10"><header className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-9"><div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div className="space-y-3"><p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Marketplace workspace</p><h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{pageTitle}</h1><p className="max-w-2xl text-base leading-7 text-muted-foreground">{pageDescription}</p></div><Button onClick={activeRole === "FREELANCER" ? openCreatePackage : openCreateJob}>{activeRole === "FREELANCER" ? "Create package" : "Create job post"}</Button></div><p className="pointer-events-none absolute -bottom-8 right-8 font-display text-8xl text-primary/10" aria-hidden="true">{activeRole === "FREELANCER" ? "offer" : "brief"}</p></header>{activeRole === "FREELANCER" ? <PackageGrid packages={ownPackages} userId={userId} loading={packagesQuery.isPending} error={packagesQuery.error ? messageFromError(packagesQuery.error) : null} onCreate={openCreatePackage} onEdit={openEditPackage} onToggle={togglePackage} onDelete={(item) => setDeleteTarget({ kind: "package", item })} /> : <JobPostsTable jobs={ownJobs} userId={userId} loading={jobsQuery.isPending} error={jobsQuery.error ? messageFromError(jobsQuery.error) : null} onCreate={openCreateJob} onEdit={openEditJob} onStatus={toggleJob} onDelete={(item) => setDeleteTarget({ kind: "job", item })} />}<PackageFormDialog open={packageDialogOpen} packageItem={editingPackage} pending={isPackagePending} onOpenChange={setPackageDialogOpen} onSubmit={submitPackage} /><JobPostFormDialog open={jobDialogOpen} job={editingJob} pending={isJobPending} onOpenChange={setJobDialogOpen} onSubmit={submitJob} /><DeleteRecordAlertDialog open={deleteTarget !== null} label={deleteTarget?.kind === "package" ? "package" : "job post"} pending={deletePackage.isPending || deleteJob.isPending} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} onConfirm={confirmDelete} />{toast ? <MarketplaceToast message={toast.message} kind={toast.kind} /> : null}</div>;
}
