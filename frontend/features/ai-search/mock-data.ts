import { catalogPackagePresentation } from "@/features/catalog/mock-data";

export const aiAssistantIdentity = {
  name: "Gigmatch AI",
  initials: "IA",
  prompt: "How can I help you find the right talent?",
} as const;

export function getAiSearchPackagePresentation(id: string) {
  return catalogPackagePresentation[id];
}
