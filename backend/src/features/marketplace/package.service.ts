import type {
  CatalogPackage,
  CatalogPage,
  CatalogDeleteResponse,
  CreatePackageRequest,
  PackageListQuery,
  UpdatePackageRequest,
} from 'shared/schemas';
import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { env } from '../../config/env.js';
import { createTextEmbedding } from '../../config/gemini.js';
import { ApiError } from '../../utils/api-error.js';
import {
  countOwnedActivePackages,
  createPackage,
  findActivePackageTier,
  findActiveSubscription,
  findFreelancerProfileId,
  findOwnedPackage,
  findPackageById,
  findPublicPackageById,
  listPackages,
  setPackageEmbedding,
  softDeletePackage,
  updatePackage,
} from './package.repository.js';
import type { CatalogClient } from './package.repository.js';
import { mapPackage, mapPage, toVectorLiteral } from './catalog.types.js';
import { prisma } from '../../config/prisma.js';

const VECTOR_DIMENSION = 1536;

function assertEmbeddingDimension(embedding: number[]): void {
  if (embedding.length !== env.GEMINI_EMBEDDING_OUTPUT_DIMENSIONALITY || embedding.length !== VECTOR_DIMENSION) {
    throw new ApiError(502, 'EMBEDDING_DIMENSION_MISMATCH', 'Embedding generation returned an unsupported dimension.');
  }
}

function packageEmbeddingText(input: { title: string; description: string | null; price_mmk: string; delivery_days: number; features: string[] }): string {
  return [`Title: ${input.title}`, `Description: ${input.description ?? ''}`, `Price MMK: ${input.price_mmk}`, `Delivery days: ${input.delivery_days}`, `Features: ${input.features.join(', ')}`].join('\n');
}

async function createEmbedding(text: string): Promise<number[]> {
  const embedding = await createTextEmbedding(text);
  assertEmbeddingDimension(embedding);
  return embedding;
}

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

async function getFreelancerId(userId: string): Promise<string> {
  const profileId = await findFreelancerProfileId(userId);
  if (profileId === null) throw new ApiError(409, 'PROFILE_REQUIRED', 'A freelancer profile is required.');
  return profileId;
}

async function enforceCreationLimit(userId: string, freelancerId: string, client: CatalogClient = prisma): Promise<void> {
  const plan = await findActiveSubscription(userId, 'FREELANCER', client);
  if (plan === null) throw new ApiError(409, 'SUBSCRIPTION_REQUIRED', 'An active freelancer subscription is required.');
  const count = await countOwnedActivePackages(freelancerId, client);
  if (count >= plan.max_packages) throw new ApiError(409, 'PLAN_LIMIT_REACHED', 'Your subscription package limit has been reached.');
}

export async function createCatalogPackage(userId: string, input: CreatePackageRequest): Promise<CatalogPackage> {
  const freelancerId = await getFreelancerId(userId);
  if (input.tier_id !== undefined && input.tier_id !== null && !(await findActivePackageTier(input.tier_id))) {
    throw new ApiError(404, 'PACKAGE_TIER_NOT_FOUND', 'The selected package tier was not found.');
  }
  const embedding = await createEmbedding(packageEmbeddingText({ ...input, description: input.description, price_mmk: input.price_mmk, features: input.features ?? [] }));

  try {
    return await prisma.$transaction(async (transaction) => {
      await enforceCreationLimit(userId, freelancerId, transaction);
      //=> Create package if every thign ok
      const created = await createPackage(freelancerId, input, transaction);
      await setPackageEmbedding(created.id, toVectorLiteral(embedding), transaction);
      const record = await findPackageById(created.id, transaction);
      if (record === null) throw new ApiError(500, 'PACKAGE_CREATE_FAILED', 'The package could not be loaded after creation.');
      return mapPackage(record);
    });
  } catch (error: unknown) {
    if (error instanceof ApiError || isPrismaError(error, 'P2002')) throw error;
    throw error;
  }
}

export async function listCatalogPackages(filters: PackageListQuery): Promise<CatalogPage<CatalogPackage>> {
  const result = await listPackages(filters);
  return mapPage(result.records, filters.page, filters.page_size, result.total, mapPackage);
}

export async function getCatalogPackage(id: string): Promise<CatalogPackage> {
  const record = await findPublicPackageById(id);
  if (record === null) throw new ApiError(404, 'PACKAGE_NOT_FOUND', 'Package not found.');
  return mapPackage(record);
}

export async function updateCatalogPackage(userId: string, id: string, input: UpdatePackageRequest): Promise<CatalogPackage> {
  const freelancerId = await getFreelancerId(userId);
  const current = await findOwnedPackage(id, freelancerId);
  if (current === null) throw new ApiError(404, 'PACKAGE_NOT_FOUND', 'Package not found.');
  if (input.tier_id !== undefined && input.tier_id !== null && !(await findActivePackageTier(input.tier_id))) {
    throw new ApiError(404, 'PACKAGE_TIER_NOT_FOUND', 'The selected package tier was not found.');
  }
  const embedding = await createEmbedding(packageEmbeddingText({
    title: input.title ?? current.title,
    description: input.description ?? current.description,
    price_mmk: input.price_mmk ?? current.price_mmk.toString(),
    delivery_days: input.delivery_days ?? current.delivery_days,
    features: input.features ?? (Array.isArray(current.features) ? current.features.filter((value): value is string => typeof value === 'string') : []),
  }));

  return prisma.$transaction(async (transaction) => {
    await updatePackage(id, input, transaction);
    await setPackageEmbedding(id, toVectorLiteral(embedding), transaction);
    const record = await findPackageById(id, transaction);
    if (record === null) throw new ApiError(404, 'PACKAGE_NOT_FOUND', 'Package not found.');
    return mapPackage(record);
  });
}

export async function deleteCatalogPackage(userId: string, id: string): Promise<CatalogDeleteResponse> {
  const freelancerId = await getFreelancerId(userId);
  const current = await findOwnedPackage(id, freelancerId);
  if (current === null) throw new ApiError(404, 'PACKAGE_NOT_FOUND', 'Package not found.');
  await softDeletePackage(id, freelancerId);
  return { id, deleted: true };
}
