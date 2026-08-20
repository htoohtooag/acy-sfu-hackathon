import type { SearchPackagesToolInput } from 'shared/schemas';
import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { supabaseAdmin } from '../../config/supabase.js';
import type {
  AiSearchPlanMode,
  PackageSearchCard,
  PlatformDocumentResult,
} from './ai-search.types.js';

type PackageRankRow = {
  id: string;
  distance: number;
};

type PlatformDocumentRankRow = {
  title: string;
  content: string;
  distance: number;
};

const packageCardSelect = {
  id: true,
  title: true,
  description: true,
  price_mmk: true,
  delivery_days: true,
  features: true,
  freelancer: {
    select: {
      id: true,
      headline: true,
      location_city: true,
      is_verified: true,
      completed_projects_count: true,
      user: { select: { full_name: true, avatar_url: true } },
    },
  },
  tier: { select: { id: true, name: true, display_name: true } },
} satisfies Prisma.PackageSelect;

export async function findActiveClientAiSearchMode(userId: string): Promise<AiSearchPlanMode | null> {
  const subscription = await prisma.userSubscription.findFirst({
    where: {
      user_id: userId,
      status: 'ACTIVE',
      plan: { audience: 'CLIENT', is_active: true },
      OR: [{ ends_at: null }, { ends_at: { gt: new Date() } }],
    },
    orderBy: { created_at: 'desc' },
    select: { plan: { select: { ai_search_mode: true } } },
  });

  if (subscription === null) {
    return null;
  }

  return subscription.plan.ai_search_mode === 'BASIC' ? 'BASIC' : 'AGENT';
}

function getStringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

async function getFirstSampleWork(freelancerId: string): Promise<{ id: string; title: string; image_path: string } | null> {
  return prisma.freelancerSampleWork.findFirst({
    where: { freelancer_id: freelancerId },
    orderBy: [{ sort_order: 'asc' }, { id: 'asc' }],
    select: { id: true, title: true, image_path: true },
  });
}

async function getSampleWorkImageUrl(sampleWork: { image_path: string }): Promise<string | null> {
  if (sampleWork.image_path.trim().length === 0) {
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(env.SUPABASE_FREELANCER_SAMPLE_WORK_BUCKET)
      .createSignedUrl(sampleWork.image_path, env.FREELANCER_SAMPLE_WORK_SIGNED_URL_TTL_SECONDS);

    return error === null && data?.signedUrl !== undefined ? data.signedUrl : null;
  } catch (error: unknown) {
    console.warn('AI search sample work signing failed.', { error });
    return null;
  }
}

export async function searchPackages(
  input: SearchPackagesToolInput,
  embeddingVector: string,
): Promise<PackageSearchCard[]> {
  const maxBudget = input.max_budget_mmk === undefined ? null : BigInt(input.max_budget_mmk);
  const rankRows = await prisma.$queryRaw<PackageRankRow[]>(Prisma.sql`
    SELECT
      p.id::text AS id,
      (p.embedding <=> ${embeddingVector}::vector)::double precision AS distance
    FROM packages AS p
    INNER JOIN freelancer_profiles AS fp ON fp.id = p.freelancer_id
    INNER JOIN users AS u ON u.id = fp.user_id
    WHERE p.deleted_at IS NULL
      AND p.is_active = true
      AND p.embedding IS NOT NULL
      AND fp.deleted_at IS NULL
      AND u.deleted_at IS NULL
      AND u.status = 'ACTIVE'
      AND (
        ${input.skill ?? null}::text IS NULL
        OR EXISTS (
          SELECT 1
          FROM unnest(fp.skills) AS skill_value
          WHERE lower(skill_value) = lower(${input.skill ?? null}::text)
        )
      )
      AND (
        ${input.location_city ?? null}::text IS NULL
        OR lower(coalesce(fp.location_city, '')) = lower(${input.location_city ?? null}::text)
      )
      AND (${maxBudget}::bigint IS NULL OR p.price_mmk <= ${maxBudget}::bigint)
    ORDER BY p.embedding <=> ${embeddingVector}::vector ASC, p.id ASC
    LIMIT 5
  `);

  if (rankRows.length === 0) {
    return [];
  }

  const records = await prisma.package.findMany({
    where: {
      id: { in: rankRows.map((row) => row.id) },
      deleted_at: null,
      is_active: true,
      freelancer: {
        deleted_at: null,
        user: { deleted_at: null, status: 'ACTIVE' },
      },
    },
    select: packageCardSelect,
  });
  const recordsById = new Map(records.map((record) => [record.id, record]));

  const mappedRecords = await Promise.all(rankRows.map(async (rankRow) => {
    const record = recordsById.get(rankRow.id);
    if (record === undefined) {
      return null;
    }

    const firstSampleWork = await getFirstSampleWork(record.freelancer.id);
    const sampleWorkImageUrl = firstSampleWork === null ? null : await getSampleWorkImageUrl(firstSampleWork);

    return [{
      id: record.id,
      title: record.title,
      description: record.description,
      price_mmk: record.price_mmk.toString(),
      delivery_days: record.delivery_days,
      features: getStringArray(record.features),
      tier: record.tier,
      freelancer: {
        id: record.freelancer.id,
        name: record.freelancer.user.full_name,
        avatar_url: record.freelancer.user.avatar_url,
        headline: record.freelancer.headline,
        city: record.freelancer.location_city,
        is_verified: record.freelancer.is_verified,
        completed_projects_count: record.freelancer.completed_projects_count,
      },
      sample_work: firstSampleWork !== null && sampleWorkImageUrl !== null
        ? { id: firstSampleWork.id, title: firstSampleWork.title, image_url: sampleWorkImageUrl }
        : null,
    } satisfies PackageSearchCard];
  }));

  return mappedRecords.flatMap((record) => record ?? []);
}

export async function searchPlatformDocuments(
  embeddingVector: string,
): Promise<PlatformDocumentResult[]> {
  const rows = await prisma.$queryRaw<PlatformDocumentRankRow[]>(Prisma.sql`
    SELECT
      title,
      content,
      (embedding <=> ${embeddingVector}::vector)::double precision AS distance
    FROM platform_documents
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${embeddingVector}::vector ASC, title ASC
    LIMIT 2
  `);

  return rows.map(({ title, content }) => ({ title, content }));
}
