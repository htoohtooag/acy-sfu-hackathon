import type {
  CatalogApiSuccess,
  CatalogPackage,
  CatalogPackageListResponse,
  FreelancerPublicProfile,
} from "shared/schemas";

import { env } from "@/lib/env";

const REVALIDATE_SECONDS = 60;

export type CatalogPackageQuery = {
  page?: number;
  page_size?: number;
  search?: string;
  min_price_mmk?: string;
  max_price_mmk?: string;
  tier_id?: string;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isCatalogPackage(value: unknown): value is CatalogPackage {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") return false;
  const freelancer = value.freelancer;
  if (!isRecord(freelancer) || typeof freelancer.id !== "string" || !isRecord(freelancer.user) || !Array.isArray(freelancer.sample_works)) return false;
  return freelancer.sample_works.every((sample) => isRecord(sample) && typeof sample.id === "string" && typeof sample.title === "string" && typeof sample.image_url === "string");
}

function isPackagePage(value: unknown): value is CatalogPackageListResponse {
  if (!isRecord(value) || !Array.isArray(value.items)) return false;
  return typeof value.page === "number" && typeof value.page_size === "number" && typeof value.total === "number" && value.items.every(isCatalogPackage);
}

function isFreelancerProfile(value: unknown): value is FreelancerPublicProfile {
  if (!isRecord(value) || typeof value.id !== "string" || !Array.isArray(value.skills) || !Array.isArray(value.packages) || !Array.isArray(value.sample_works)) return false;
  return isRecord(value.user);
}

function isSuccessEnvelope(value: unknown): value is CatalogApiSuccess<unknown> {
  return isRecord(value) && value.success === true && "data" in value;
}

function apiUrl(path: string): string {
  return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}${path}`;
}

function queryString(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `?${search}` : "";
}

async function fetchCatalog<T>(path: string, tags: string[], guard: (value: unknown) => value is T): Promise<T> {
  const response = await fetch(apiUrl(path), { next: { revalidate: REVALIDATE_SECONDS, tags } });
  if (!response.ok) throw new Error(`Catalog request failed with status ${response.status}.`);
  const payload: unknown = await response.json();
  if (!isSuccessEnvelope(payload) || !guard(payload.data)) throw new Error("Catalog response was invalid.");
  return payload.data;
}

export async function getCatalogPackages(query: CatalogPackageQuery = {}): Promise<CatalogPackageListResponse> {
  return fetchCatalog(
    `/api/v1/packages${queryString({ page: query.page ?? 1, page_size: query.page_size ?? 50, search: query.search, min_price_mmk: query.min_price_mmk, max_price_mmk: query.max_price_mmk, tier_id: query.tier_id })}`,
    ["packages", `packages:${query.page ?? 1}:${query.page_size ?? 50}:${query.search ?? ""}:${query.min_price_mmk ?? ""}:${query.max_price_mmk ?? ""}:${query.tier_id ?? ""}`],
    isPackagePage,
  );
}

export async function getCatalogPackage(id: string): Promise<CatalogPackage> {
  return fetchCatalog(`/api/v1/packages/${encodeURIComponent(id)}`, ["packages", `package:${id}`], isCatalogPackage);
}

export async function getPublicFreelancerProfile(id: string): Promise<FreelancerPublicProfile> {
  return fetchCatalog(`/api/v1/freelancers/${encodeURIComponent(id)}`, ["freelancers", `freelancer:${id}`], isFreelancerProfile);
}
