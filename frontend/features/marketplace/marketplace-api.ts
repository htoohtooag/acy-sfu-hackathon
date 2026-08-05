"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CatalogJobPost, CatalogPackage, CatalogPage, CatalogDeleteResponse, CreateJobPostRequest, CreatePackageRequest, PackageTierLookup, UpdateJobPostRequest, UpdatePackageRequest } from "shared/schemas";

import { authenticatedApiRequest } from "@/lib/api-client";

const pageQuery = "page=1&page_size=50&owner=true";

async function getMyPackages(signal?: AbortSignal): Promise<CatalogPage<CatalogPackage>> {
  return authenticatedApiRequest<CatalogPage<CatalogPackage>>(`/api/v1/packages?${pageQuery}`, { signal });
}

async function getMyJobs(signal?: AbortSignal): Promise<CatalogPage<CatalogJobPost>> {
  return authenticatedApiRequest<CatalogPage<CatalogJobPost>>(`/api/v1/jobs?${pageQuery}`, { signal });
}

async function getPackageTiers(signal?: AbortSignal): Promise<PackageTierLookup[]> {
  return authenticatedApiRequest<PackageTierLookup[]>("/api/v1/lookups/package-tiers", { signal });
}

async function createPackage(input: CreatePackageRequest): Promise<CatalogPackage> {
  return authenticatedApiRequest<CatalogPackage>("/api/v1/packages", { method: "POST", body: JSON.stringify(input) });
}

async function updatePackage(input: { id: string; data: UpdatePackageRequest }): Promise<CatalogPackage> {
  return authenticatedApiRequest<CatalogPackage>(`/api/v1/packages/${encodeURIComponent(input.id)}`, { method: "PATCH", body: JSON.stringify(input.data) });
}

async function deletePackage(id: string): Promise<CatalogDeleteResponse> {
  return authenticatedApiRequest<CatalogDeleteResponse>(`/api/v1/packages/${encodeURIComponent(id)}`, { method: "DELETE" });
}

async function createJob(input: CreateJobPostRequest): Promise<CatalogJobPost> {
  return authenticatedApiRequest<CatalogJobPost>("/api/v1/jobs", { method: "POST", body: JSON.stringify(input) });
}

async function updateJob(input: { id: string; data: UpdateJobPostRequest }): Promise<CatalogJobPost> {
  return authenticatedApiRequest<CatalogJobPost>(`/api/v1/jobs/${encodeURIComponent(input.id)}`, { method: "PATCH", body: JSON.stringify(input.data) });
}

async function deleteJob(id: string): Promise<CatalogDeleteResponse> {
  return authenticatedApiRequest<CatalogDeleteResponse>(`/api/v1/jobs/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export const myPackagesQueryOptions = queryOptions({ queryKey: ["my-packages"], queryFn: ({ signal }) => getMyPackages(signal), staleTime: 1000 * 60 * 2 });
export const myJobsQueryOptions = queryOptions({ queryKey: ["my-jobs"], queryFn: ({ signal }) => getMyJobs(signal), staleTime: 1000 * 60 * 2 });
export const packageTiersQueryOptions = queryOptions({ queryKey: ["package-tiers"], queryFn: ({ signal }) => getPackageTiers(signal), staleTime: 1000 * 60 * 2 });

export function useMyPackages(enabled = true) { return useQuery({ ...myPackagesQueryOptions, enabled }); }
export function useMyJobs(enabled = true) { return useQuery({ ...myJobsQueryOptions, enabled }); }
export function usePackageTiers(enabled = true) { return useQuery({ ...packageTiersQueryOptions, enabled }); }

export function useCreatePackage() {
  const client = useQueryClient();
  return useMutation({ mutationFn: createPackage, onSuccess: () => { void client.invalidateQueries({ queryKey: ["my-packages"] }); } });
}

export function useUpdatePackage() {
  const client = useQueryClient();
  return useMutation({ mutationFn: updatePackage, onSuccess: () => { void client.invalidateQueries({ queryKey: ["my-packages"] }); } });
}

export function useDeletePackage() {
  const client = useQueryClient();
  return useMutation({ mutationFn: deletePackage, onSuccess: () => { void client.invalidateQueries({ queryKey: ["my-packages"] }); } });
}

export function useCreateJob() {
  const client = useQueryClient();
  return useMutation({ mutationFn: createJob, onSuccess: () => { void client.invalidateQueries({ queryKey: ["my-jobs"] }); } });
}

export function useUpdateJob() {
  const client = useQueryClient();
  return useMutation({ mutationFn: updateJob, onSuccess: () => { void client.invalidateQueries({ queryKey: ["my-jobs"] }); } });
}

export function useDeleteJob() {
  const client = useQueryClient();
  return useMutation({ mutationFn: deleteJob, onSuccess: () => { void client.invalidateQueries({ queryKey: ["my-jobs"] }); } });
}
