import type {
  CatalogApiSuccess,
  CatalogJobPost,
  CatalogJobPostListResponse,
  CatalogPackage,
  CatalogPackageListResponse,
  FreelancerPublicProfile,
} from "shared/schemas";

import { env } from "@/lib/env";

const PAGE_SIZE = 50;
const MAX_SITEMAP_PAGES = 100;
const PUBLIC_REVALIDATE_SECONDS = 60;

export type JobListQuery = {
  page?: number;
  page_size?: number;
  max_budget_mmk?: string;
  search?: string;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isCatalogJobPost(value: unknown): value is CatalogJobPost {
  if (!isRecord(value)) return false;
  const client = value.client;
  return typeof value.id === "string" && typeof value.title === "string" && typeof value.description === "string" && isRecord(client) && isRecord(client.user);
}

function isCatalogPackage(value: unknown): value is CatalogPackage {
  if (!isRecord(value)) return false;
  const freelancer = value.freelancer;
  return typeof value.id === "string" && typeof value.updated_at === "string" && isRecord(freelancer) && typeof freelancer.id === "string";
}

function isFreelancerProfile(value: unknown): value is FreelancerPublicProfile {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && Array.isArray(value.packages);
}

function isCatalogPage<T>(value: unknown, itemGuard: (item: unknown) => item is T): value is { items: T[]; page: number; page_size: number; total: number } {
  if (!isRecord(value) || !Array.isArray(value.items)) return false;
  return typeof value.page === "number" && typeof value.page_size === "number" && typeof value.total === "number" && value.items.every(itemGuard);
}

function isSuccessEnvelope(value: unknown): value is CatalogApiSuccess<unknown> {
  return isRecord(value) && value.success === true && "data" in value;
}

function publicUrl(path: string): string {
  return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}${path}`;
}

async function fetchJson<T>(path: string, tags: string[], validate: (value: unknown) => value is T): Promise<T> {
  const response = await fetch(publicUrl(path), {
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS, tags },
  });

  if (!response.ok) throw new Error(`Public catalog request failed with status ${response.status}.`);
  const payload: unknown = await response.json();
  if (!isSuccessEnvelope(payload) || !validate(payload.data)) throw new Error("Public catalog response was invalid.");
  return payload.data;
}

function queryString(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const result = params.toString();
  return result ? `?${result}` : "";
}

export function getPublicSiteUrl(path: string = ""): string {
  return `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}${path}`;
}

export async function getJobs(query: JobListQuery = {}): Promise<CatalogJobPostListResponse> {
  const page = query.page ?? 1;
  const pageSize = query.page_size ?? 20;
  return fetchJson(
    `/api/v1/jobs${queryString({ page, page_size: pageSize, max_budget_mmk: query.max_budget_mmk, search: query.search })}`,
    ["jobs", `jobs:${page}:${pageSize}:${query.max_budget_mmk ?? ""}:${query.search ?? ""}`],
    (value): value is CatalogJobPostListResponse => isCatalogPage(value, isCatalogJobPost),
  );
}

export async function getJob(id: string): Promise<CatalogJobPost> {
  return fetchJson(`/api/v1/jobs/${encodeURIComponent(id)}`, ["jobs", `job:${id}`], isCatalogJobPost);
}

export async function getPackagesForSitemap(): Promise<CatalogPackage[]> {
  const packages: CatalogPackage[] = [];
  for (let page = 1; page <= MAX_SITEMAP_PAGES; page += 1) {
    const result = await fetchJson(
      `/api/v1/packages${queryString({ page, page_size: PAGE_SIZE })}`,
      ["packages", "sitemap"],
      (value): value is CatalogPackageListResponse => isCatalogPage(value, isCatalogPackage),
    );
    packages.push(...result.items.filter((item) => item.is_active));
    if (packages.length >= result.total || result.items.length === 0) break;
  }
  return packages;
}

export async function getJobsForSitemap(): Promise<CatalogJobPost[]> {
  const jobs: CatalogJobPost[] = [];
  for (let page = 1; page <= MAX_SITEMAP_PAGES; page += 1) {
    const result = await getJobs({ page, page_size: PAGE_SIZE });
    jobs.push(...result.items.filter((item) => item.status === "OPEN"));
    if (jobs.length >= result.total || result.items.length === 0) break;
  }
  return jobs;
}

export async function getPublicFreelancer(id: string): Promise<FreelancerPublicProfile> {
  return fetchJson(`/api/v1/freelancers/${encodeURIComponent(id)}`, ["freelancers", `freelancer:${id}`], isFreelancerProfile);
}
