import type {
  CatalogJobPost,
  CatalogPage,
  CatalogDeleteResponse,
  CreateJobPostRequest,
  JobPostListQuery,
  UpdateJobPostRequest,
} from 'shared/schemas';
import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { env } from '../../config/env.js';
import { createTextEmbedding } from '../../config/gemini.js';
import { ApiError } from '../../utils/api-error.js';
import { mapJob, mapPage, toVectorLiteral } from './catalog.types.js';
import {
  countOwnedOpenJobs,
  createJob,
  findClientProfileId,
  findJobById,
  findOwnedJob,
  listJobs,
  setJobEmbedding,
  softDeleteJob,
  updateJob,
} from './job.repository.js';
import { findActiveSubscription } from './package.repository.js';
import type { CatalogClient } from './package.repository.js';
import { prisma } from '../../config/prisma.js';

const VECTOR_DIMENSION = 1536;

function assertEmbeddingDimension(embedding: number[]): void {
  if (embedding.length !== env.GEMINI_EMBEDDING_OUTPUT_DIMENSIONALITY || embedding.length !== VECTOR_DIMENSION) {
    throw new ApiError(502, 'EMBEDDING_DIMENSION_MISMATCH', 'Embedding generation returned an unsupported dimension.');
  }
}

function jobEmbeddingText(input: { title: string; description: string; budget_min_mmk: string | null; budget_max_mmk: string | null; expected_deadline: string | null }): string {
  return [`Title: ${input.title}`, `Description: ${input.description}`, `Budget minimum MMK: ${input.budget_min_mmk ?? ''}`, `Budget maximum MMK: ${input.budget_max_mmk ?? ''}`, `Expected deadline: ${input.expected_deadline ?? ''}`].join('\n');
}

async function createEmbedding(text: string): Promise<number[]> {
  const embedding = await createTextEmbedding(text);
  assertEmbeddingDimension(embedding);
  return embedding;
}

async function getClientId(userId: string): Promise<string> {
  const profileId = await findClientProfileId(userId);
  if (profileId === null) throw new ApiError(409, 'PROFILE_REQUIRED', 'A client profile is required.');
  return profileId;
}

async function enforceCreationLimit(userId: string, clientId: string, client: CatalogClient = prisma): Promise<void> {
  const plan = await findActiveSubscription(userId, 'CLIENT', client);
  if (plan === null) throw new ApiError(409, 'SUBSCRIPTION_REQUIRED', 'An active client subscription is required.');
  const count = await countOwnedOpenJobs(clientId, client);
  if (count >= plan.max_job_posts) throw new ApiError(409, 'PLAN_LIMIT_REACHED', 'Your subscription job post limit has been reached.');
}

function assertStatusTransition(current: string, next: string | undefined): void {
  if (next === undefined || current === next) return;
  const allowed: Record<string, string[]> = { OPEN: ['HIRING', 'CLOSED'], HIRING: ['CLOSED'], CLOSED: [] };
  if (!allowed[current]?.includes(next)) throw new ApiError(409, 'INVALID_JOB_STATUS_TRANSITION', 'The job status transition is not allowed.');
}

export async function createCatalogJob(userId: string, input: CreateJobPostRequest): Promise<CatalogJobPost> {
  const clientId = await getClientId(userId);
  const embedding = await createEmbedding(jobEmbeddingText({
    title: input.title,
    description: input.description,
    budget_min_mmk: input.budget_min_mmk ?? null,
    budget_max_mmk: input.budget_max_mmk ?? null,
    expected_deadline: input.expected_deadline ?? null,
  }));

  return prisma.$transaction(async (transaction) => {
    await enforceCreationLimit(userId, clientId, transaction);
    const created = await createJob(clientId, input, transaction);
    await setJobEmbedding(created.id, toVectorLiteral(embedding), transaction);
    const record = await findOwnedJob(created.id, clientId, transaction);
    if (record === null) throw new ApiError(500, 'JOB_CREATE_FAILED', 'The job could not be loaded after creation.');
    return mapJob(record);
  });
}

export async function listCatalogJobs(filters: JobPostListQuery): Promise<CatalogPage<CatalogJobPost>> {
  const result = await listJobs(filters);
  return mapPage(result.records, filters.page, filters.page_size, result.total, mapJob);
}

export async function getCatalogJob(id: string): Promise<CatalogJobPost> {
  const record = await findJobById(id);
  if (record === null) throw new ApiError(404, 'JOB_NOT_FOUND', 'Job post not found.');
  return mapJob(record);
}

export async function updateCatalogJob(userId: string, id: string, input: UpdateJobPostRequest): Promise<CatalogJobPost> {
  const clientId = await getClientId(userId);
  const current = await findOwnedJob(id, clientId);
  if (current === null) throw new ApiError(404, 'JOB_NOT_FOUND', 'Job post not found.');
  assertStatusTransition(current.status, input.status);
  const embedding = await createEmbedding(jobEmbeddingText({
    title: input.title ?? current.title,
    description: input.description ?? current.description,
    budget_min_mmk: input.budget_min_mmk === undefined ? current.budget_min_mmk?.toString() ?? null : input.budget_min_mmk,
    budget_max_mmk: input.budget_max_mmk === undefined ? current.budget_max_mmk?.toString() ?? null : input.budget_max_mmk,
    expected_deadline: input.expected_deadline === undefined ? current.expected_deadline?.toISOString().slice(0, 10) ?? null : input.expected_deadline,
  }));

  return prisma.$transaction(async (transaction) => {
    await updateJob(id, input, transaction);
    await setJobEmbedding(id, toVectorLiteral(embedding), transaction);
    const record = await findOwnedJob(id, clientId, transaction);
    if (record === null) throw new ApiError(404, 'JOB_NOT_FOUND', 'Job post not found.');
    return mapJob(record);
  });
}

export async function deleteCatalogJob(userId: string, id: string): Promise<CatalogDeleteResponse> {
  const clientId = await getClientId(userId);
  const current = await findOwnedJob(id, clientId);
  if (current === null) throw new ApiError(404, 'JOB_NOT_FOUND', 'Job post not found.');
  await softDeleteJob(id, clientId);
  return { id, deleted: true };
}
