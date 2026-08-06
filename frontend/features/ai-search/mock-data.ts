import type { CatalogPackage } from "shared/schemas";

import { catalogPackagePresentation, mockCatalogPackages } from "@/features/catalog/mock-data";

export type AiSearchMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  recommendationIds?: readonly string[];
};

export const aiAssistantIdentity = {
  name: "Indy AI",
  initials: "IA",
  prompt: "How can I help you find the right talent?",
} as const;

export const aiSearchMessages: readonly AiSearchMessage[] = [
  {
    id: "ai-search-intro",
    role: "assistant",
    text: "Tell me what you are building and I will help you find a great fit from the marketplace.",
  },
  {
    id: "ai-search-user-brief",
    role: "user",
    text: "I need a designer for a calm, conversion-focused product dashboard.",
  },
  {
    id: "ai-search-recommendations",
    role: "assistant",
    text: "These services look like a strong starting point for that brief:",
    recommendationIds: ["catalog-package-1", "catalog-package-2", "catalog-package-4"],
  },
];

export function getAiSearchRecommendations(ids: readonly string[]): CatalogPackage[] {
  return ids
    .map((id) => mockCatalogPackages.find((item) => item.id === id && item.is_active))
    .filter((item): item is CatalogPackage => Boolean(item));
}

export function getAiSearchPackagePresentation(id: string) {
  return catalogPackagePresentation[id];
}
