import type { SearchPackagesToolInput, SearchPlatformDocsToolInput } from 'shared/schemas';

export type AiSearchPlanMode = 'BASIC' | 'AGENT';

export type PackageSearchCard = {
  id: string;
  title: string;
  description: string | null;
  price_mmk: string;
  delivery_days: number;
  features: string[];
  tier: {
    id: string;
    name: string;
    display_name: string | null;
  } | null;
  freelancer: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    headline: string | null;
    city: string | null;
    is_verified: boolean;
    completed_projects_count: number;
  };
  sample_work: {
    id: string;
    title: string;
    image_url: string;
  } | null;
};

export type PlatformDocumentResult = {
  title: string;
  content: string;
};

export type PackageSearchOptions = SearchPackagesToolInput & {
  rankingQuery: string;
};

export type PlatformDocumentSearchOptions = SearchPlatformDocsToolInput;
