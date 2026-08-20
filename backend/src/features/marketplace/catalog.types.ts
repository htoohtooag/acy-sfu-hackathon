import type {
  CatalogJobPost,
  CatalogPackage,
  CatalogPage,
  FreelancerPublicSampleWork,
  JobPostListQuery,
  JobPostStatus,
  PackageListQuery,
} from 'shared/schemas';
import type { Prisma } from '../../../prisma/generated/prisma/client.js';

export type CatalogListOptions = {
  page: number;
  pageSize: number;
};

export type PackageFilters = PackageListQuery;
export type JobFilters = JobPostListQuery;

export type PackageRecord = Prisma.PackageGetPayload<{
  select: {
    id: true;
    freelancer_id: true;
    tier_id: true;
    title: true;
    description: true;
    price_mmk: true;
    delivery_days: true;
    features: true;
    is_active: true;
    created_at: true;
    updated_at: true;
    freelancer: {
      select: {
        id: true;
        user_id: true;
        headline: true;
        location_city: true;
        is_verified: true;
        user: { select: { id: true; full_name: true; avatar_url: true } };
        sample_works: { select: { id: true; title: true; description: true; tags: true; image_path: true; sort_order: true } };
      };
    };
    tier: { select: { id: true; name: true; display_name: true } };
  };
}>;

export type JobRecord = Prisma.JobPostGetPayload<{
  select: {
    id: true;
    client_id: true;
    title: true;
    description: true;
    budget_min_mmk: true;
    budget_max_mmk: true;
    expected_deadline: true;
    status: true;
    created_at: true;
    updated_at: true;
    client: {
      select: {
        id: true;
        user_id: true;
        company_name: true;
        industry: true;
        user: { select: { id: true; full_name: true; avatar_url: true } };
      };
    };
  };
}>;

function getStringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

export function mapPackage(record: PackageRecord, sampleWorks: FreelancerPublicSampleWork[]): CatalogPackage {
  return {
    id: record.id,
    freelancer_id: record.freelancer_id,
    tier_id: record.tier_id,
    title: record.title,
    description: record.description,
    price_mmk: record.price_mmk.toString(),
    delivery_days: record.delivery_days,
    features: getStringArray(record.features),
    is_active: record.is_active,
    created_at: record.created_at.toISOString(),
    updated_at: record.updated_at.toISOString(),
    freelancer: { ...record.freelancer, sample_works: sampleWorks },
    tier: record.tier,
  };
}

export function mapJob(record: JobRecord): CatalogJobPost {
  if (record.status === 'DELETED') {
    throw new Error('Deleted job posts cannot be mapped to a public catalog response.');
  }

  return {
    id: record.id,
    client_id: record.client_id,
    title: record.title,
    description: record.description,
    budget_min_mmk: record.budget_min_mmk?.toString() ?? null,
    budget_max_mmk: record.budget_max_mmk?.toString() ?? null,
    expected_deadline: record.expected_deadline?.toISOString().slice(0, 10) ?? null,
    status: record.status as JobPostStatus,
    created_at: record.created_at.toISOString(),
    updated_at: record.updated_at.toISOString(),
    client: record.client,
  };
}

export function mapPage<TRecord, TOutput>(
  records: TRecord[],
  page: number,
  pageSize: number,
  total: number,
  mapper: (record: TRecord) => TOutput,
): CatalogPage<TOutput> {
  return { items: records.map(mapper), page, page_size: pageSize, total };
}

export function toVectorLiteral(values: number[]): string {
  return `[${values.map((value) => String(value)).join(',')}]`;
}
