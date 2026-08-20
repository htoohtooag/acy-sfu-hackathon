import type { CatalogPackage, FreelancerPublicProfile, FreelancerPublicSampleWork } from "shared/schemas";

import { catalogPackagePresentation, type FreelancerProfilePresentation, type ProfileWorkHistory } from "@/features/catalog/mock-data";

export type CatalogSort = "recommended" | "price-low" | "price-high" | "fastest";

export type CatalogFilters = {
  search: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  deliveryDays: string;
  level: string;
  location: string;
  language: string;
  skill: string;
  englishLevel: string;
  sort: CatalogSort;
};

type SearchParamValue = string | string[] | undefined;
export type CatalogSearchParams = Record<string, SearchParamValue>;
export type CatalogPackageSearchQuery = { page: number; page_size: number; search?: string; min_price_mmk?: string; max_price_mmk?: string };

function firstValue(value: SearchParamValue): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function validSort(value: string): CatalogSort {
  if (value === "price-low" || value === "price-high" || value === "fastest") return value;
  return "recommended";
}

export function parseCatalogFilters(searchParams: CatalogSearchParams): CatalogFilters {
  return {
    search: firstValue(searchParams.search).trim(),
    category: firstValue(searchParams.category),
    minPrice: firstValue(searchParams.min_price_mmk),
    maxPrice: firstValue(searchParams.max_price_mmk),
    deliveryDays: firstValue(searchParams.delivery_days),
    level: firstValue(searchParams.level),
    location: firstValue(searchParams.location),
    language: firstValue(searchParams.language),
    skill: firstValue(searchParams.skill),
    englishLevel: firstValue(searchParams.english_level),
    sort: validSort(firstValue(searchParams.sort)),
  };
}

function numericValue(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatHistoryDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function mapPublicWorkHistory(profile: FreelancerPublicProfile): ProfileWorkHistory[] {
  const workHistory = Array.isArray(profile.work_history) ? profile.work_history : [];
  return workHistory.map((item) => ({
    id: item.id,
    title: item.title,
    rating: item.rating ?? 0,
    contractType: item.contract_type === "PACKAGE" ? "Package" : "Custom project",
    rate: formatMmk(item.rate_mmk),
    dates: `${formatHistoryDate(item.start_date)} - ${item.end_date ? formatHistoryDate(item.end_date) : "In progress"}`,
    review: item.review ?? "No public review yet.",
    skills: item.skills,
    status: item.status,
  }));
}

export function filterCatalogPackages(items: CatalogPackage[], filters: CatalogFilters): CatalogPackage[] {
  const search = filters.search.toLocaleLowerCase();
  const minPrice = numericValue(filters.minPrice);
  const maxPrice = numericValue(filters.maxPrice);
  const maxDeliveryDays = numericValue(filters.deliveryDays);

  const filtered = items.filter((item) => {
    const presentation = catalogPackagePresentation[item.id];
    const searchableText = [
      item.title,
      item.description,
      item.freelancer.headline ?? "",
      item.freelancer.user.full_name ?? "",
      ...item.features,
    ].join(" ").toLocaleLowerCase();

    if (search && !searchableText.includes(search)) return false;
    if (filters.category && !presentation?.categories.includes(filters.category)) return false;
    if (minPrice !== null && Number(item.price_mmk) < minPrice) return false;
    if (maxPrice !== null && Number(item.price_mmk) > maxPrice) return false;
    if (maxDeliveryDays !== null && item.delivery_days > maxDeliveryDays) return false;
    if (filters.level === "verified" && !item.freelancer.is_verified) return false;
    if (filters.level === "rising" && item.freelancer.is_verified) return false;
    if (filters.location && item.freelancer.location_city !== filters.location) return false;
    if (filters.language && !presentation?.languages.includes(filters.language)) return false;
    if (filters.skill && !presentation?.skills.includes(filters.skill)) return false;
    if (filters.englishLevel && presentation?.englishLevel !== filters.englishLevel) return false;
    return item.is_active;
  });

  return [...filtered].sort((first, second) => {
    if (filters.sort === "price-low") return Number(first.price_mmk) - Number(second.price_mmk);
    if (filters.sort === "price-high") return Number(second.price_mmk) - Number(first.price_mmk);
    if (filters.sort === "fastest") return first.delivery_days - second.delivery_days;
    return (catalogPackagePresentation[second.id]?.rating ?? 0) - (catalogPackagePresentation[first.id]?.rating ?? 0);
  });
}

export function toCatalogPackageQuery(filters: CatalogFilters): CatalogPackageSearchQuery {
  return {
    page: 1,
    page_size: 50,
    search: filters.search || undefined,
    min_price_mmk: /^[0-9]+$/.test(filters.minPrice) ? filters.minPrice : undefined,
    max_price_mmk: /^[0-9]+$/.test(filters.maxPrice) ? filters.maxPrice : undefined,
  };
}

export function sortCatalogPackages(items: CatalogPackage[], filters: CatalogFilters): CatalogPackage[] {
  return [...items].sort((first, second) => {
    if (filters.sort === "price-low") return Number(first.price_mmk) - Number(second.price_mmk);
    if (filters.sort === "price-high") return Number(second.price_mmk) - Number(first.price_mmk);
    if (filters.sort === "fastest") return first.delivery_days - second.delivery_days;
    return (catalogPackagePresentation[second.id]?.rating ?? 0) - (catalogPackagePresentation[first.id]?.rating ?? 0);
  });
}

export function mapPublicProfileToPresentation(profile: FreelancerPublicProfile): { profile: FreelancerProfilePresentation; packages: CatalogPackage[]; freelancer: CatalogPackage["freelancer"]; sampleWorks: FreelancerPublicSampleWork[] } {
  const packages: CatalogPackage[] = profile.packages.map((item) => ({
    id: item.id,
    freelancer_id: profile.id,
    tier_id: item.tier?.id ?? null,
    title: item.title,
    description: null,
    price_mmk: item.price_mmk,
    delivery_days: item.delivery_days,
    features: [],
    is_active: true,
    created_at: "1970-01-01T00:00:00.000Z",
    updated_at: "1970-01-01T00:00:00.000Z",
    freelancer: {
      id: profile.id,
      user_id: profile.user_id,
      headline: profile.headline,
      location_city: profile.location_city,
      is_verified: profile.is_verified,
      user: profile.user,
      sample_works: profile.sample_works,
    },
    tier: item.tier,
  }));

  const profilePresentation: FreelancerProfilePresentation = {
    freelancerId: profile.id,
    about: profile.bio ?? "This freelancer has not added a public introduction yet.",
    skills: profile.skills,
    successRate: Number(profile.success_rate) || 0,
    completedCount: profile.completed_projects_count,
    ratingLabel: profile.is_verified ? "Verified talent" : "Independent talent",
    rating: 0,
    reviewCount: 0,
    otherPackageIds: packages.slice(1).map((item) => item.id),
    profileImageUrl: profile.user.avatar_url ?? undefined,
    languages: [{ name: "English", fluency: "Public profile" }],
    coreExpertise: profile.skills,
    workHistory: mapPublicWorkHistory(profile),
    portfolioGallery: profile.sample_works.map((item) => ({ id: item.id, imageUrl: item.image_url, alt: item.title })),
  };

  return {
    profile: profilePresentation,
    packages,
    freelancer: {
      id: profile.id,
      user_id: profile.user_id,
      headline: profile.headline,
      location_city: profile.location_city,
      is_verified: profile.is_verified,
      user: profile.user,
      sample_works: profile.sample_works,
    },
    sampleWorks: profile.sample_works,
  };
}

export function getActiveCatalogFilterCount(filters: CatalogFilters): number {
  return [filters.category, filters.minPrice, filters.maxPrice, filters.deliveryDays, filters.level, filters.location, filters.language, filters.skill, filters.englishLevel].filter(Boolean).length;
}

export function formatMmk(value: string): string {
  return `${Number(value).toLocaleString("en-US")} MMK`;
}
