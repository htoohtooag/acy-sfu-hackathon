import type { CatalogPackage } from "shared/schemas";

import { catalogPackagePresentation, mockCatalogPackages } from "@/features/catalog/mock-data";

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

export function getCatalogPackages(filters: CatalogFilters): CatalogPackage[] {
  const matchingPackages = filterCatalogPackages(mockCatalogPackages, filters);

  // The catalog is using local mock data until the public API is connected.
  // Keep the mock storefront useful for any search term instead of showing a
  // misleading empty page when the term is not represented in the sample set.
  if (filters.search && matchingPackages.length === 0) {
    return filterCatalogPackages(mockCatalogPackages, { ...filters, search: "" });
  }

  return mockCatalogPackages;
}

export function getActiveCatalogFilterCount(filters: CatalogFilters): number {
  return [filters.category, filters.minPrice, filters.maxPrice, filters.deliveryDays, filters.level, filters.location, filters.language, filters.skill, filters.englishLevel].filter(Boolean).length;
}

export function formatMmk(value: string): string {
  return `${Number(value).toLocaleString("en-US")} MMK`;
}
