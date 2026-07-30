import type { CreateJobPostRequest, UpdateJobPostRequest } from 'shared/schemas';
import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import type { JobFilters, JobRecord } from './catalog.types.js';
import type { CatalogClient, CatalogTransaction } from './package.repository.js';

const jobSelect = {
  id: true,
  client_id: true,
  title: true,
  description: true,
  budget_min_mmk: true,
  budget_max_mmk: true,
  expected_deadline: true,
  status: true,
  created_at: true,
  updated_at: true,
  client: {
    select: {
      id: true,
      user_id: true,
      company_name: true,
      industry: true,
      user: { select: { id: true, full_name: true, avatar_url: true } },
    },
  },
} satisfies Prisma.JobPostSelect;

export async function findClientProfileId(
  userId: string,
  client: CatalogClient = prisma,
): Promise<string | null> {
  const profile = await client.clientProfile.findFirst({ where: { user_id: userId }, select: { id: true } });
  return profile?.id ?? null;
}

export async function countOwnedOpenJobs(
  clientId: string,
  client: CatalogClient = prisma,
): Promise<number> {
  return client.jobPost.count({ where: { client_id: clientId, deleted_at: null, status: 'OPEN' } });
}

export async function createJob(
  clientId: string,
  input: CreateJobPostRequest,
  client: CatalogClient = prisma,
): Promise<{ id: string }> {
  return client.jobPost.create({
    data: {
      client_id: clientId,
      title: input.title,
      description: input.description,
      budget_min_mmk: input.budget_min_mmk === undefined || input.budget_min_mmk === null ? null : BigInt(input.budget_min_mmk),
      budget_max_mmk: input.budget_max_mmk === undefined || input.budget_max_mmk === null ? null : BigInt(input.budget_max_mmk),
      expected_deadline: input.expected_deadline === undefined || input.expected_deadline === null ? null : new Date(input.expected_deadline),
    },
    select: { id: true },
  });
}

export async function findJobById(id: string, client: CatalogClient = prisma): Promise<JobRecord | null> {
  return client.jobPost.findFirst({ where: { id, deleted_at: null, status: 'OPEN' }, select: jobSelect });
}

export async function findOwnedJob(id: string, clientId: string, client: CatalogClient = prisma): Promise<JobRecord | null> {
  return client.jobPost.findFirst({ where: { id, client_id: clientId, deleted_at: null }, select: jobSelect });
}

export async function updateJob(id: string, input: UpdateJobPostRequest, client: CatalogClient = prisma): Promise<void> {
  await client.jobPost.update({
    where: { id },
    data: {
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.budget_min_mmk === undefined ? {} : { budget_min_mmk: input.budget_min_mmk === null ? null : BigInt(input.budget_min_mmk) }),
      ...(input.budget_max_mmk === undefined ? {} : { budget_max_mmk: input.budget_max_mmk === null ? null : BigInt(input.budget_max_mmk) }),
      ...(input.expected_deadline === undefined ? {} : { expected_deadline: input.expected_deadline === null ? null : new Date(input.expected_deadline) }),
      ...(input.status === undefined ? {} : { status: input.status }),
    },
  });
}

export async function setJobEmbedding(id: string, vector: string, client: CatalogTransaction): Promise<void> {
  await client.$executeRaw`UPDATE job_posts SET embedding = ${vector}::vector WHERE id = ${id}::uuid`;
}

export async function softDeleteJob(id: string, clientId: string): Promise<void> {
  await prisma.jobPost.updateMany({ where: { id, client_id: clientId, deleted_at: null }, data: { deleted_at: new Date(), status: 'DELETED' } });
}

export async function listJobs(filters: JobFilters): Promise<{ records: JobRecord[]; total: number }> {
  const where: Prisma.JobPostWhereInput = { deleted_at: null, status: 'OPEN' };
  if (filters.max_budget_mmk !== undefined) where.budget_max_mmk = { lte: BigInt(filters.max_budget_mmk) };
  if (filters.search !== undefined) where.OR = [{ title: { contains: filters.search, mode: 'insensitive' } }, { description: { contains: filters.search, mode: 'insensitive' } }];
  const [records, total] = await prisma.$transaction([
    prisma.jobPost.findMany({ where, select: jobSelect, orderBy: [{ created_at: 'desc' }, { id: 'desc' }], skip: (filters.page - 1) * filters.page_size, take: filters.page_size }),
    prisma.jobPost.count({ where }),
  ]);
  return { records, total };
}
