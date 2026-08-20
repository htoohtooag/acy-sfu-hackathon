import type { CreatePackageRequest, UpdatePackageRequest } from 'shared/schemas';
import { Prisma } from '../../../prisma/generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import type { PackageFilters, PackageRecord } from './catalog.types.js';

export type CatalogTransaction = Prisma.TransactionClient;
export type CatalogClient = CatalogTransaction | typeof prisma;

const packageSelect = {
  id: true,
  freelancer_id: true,
  tier_id: true,
  title: true,
  description: true,
  price_mmk: true,
  delivery_days: true,
  features: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  freelancer: {
    select: {
      id: true,
      user_id: true,
      headline: true,
      location_city: true,
      is_verified: true,
        user: { select: { id: true, full_name: true, avatar_url: true } },
        sample_works: {
          orderBy: [{ sort_order: 'asc' }, { id: 'asc' }],
          select: { id: true, title: true, description: true, tags: true, image_path: true, sort_order: true },
        },
    },
  },
  tier: { select: { id: true, name: true, display_name: true } },
} satisfies Prisma.PackageSelect;

export async function findFreelancerProfileId(
  userId: string,
  client: CatalogClient = prisma,
): Promise<string | null> {
  const profile = await client.freelancerProfile.findFirst({
    where: { user_id: userId, deleted_at: null },
    select: { id: true },
  });
  return profile?.id ?? null;
}

export async function findActiveSubscription(
  userId: string,
  audience: 'FREELANCER' | 'CLIENT',
  client: CatalogClient = prisma,
): Promise<{ max_packages: number; max_job_posts: number } | null> {
  const subscription = await client.userSubscription.findFirst({
    where: {
      user_id: userId,
      status: 'ACTIVE',
      plan: { audience, is_active: true },
      OR: [{ ends_at: null }, { ends_at: { gt: new Date() } }],
    },
    orderBy: { created_at: 'desc' },
    select: { plan: { select: { max_packages: true, max_job_posts: true } } },
  });
  return subscription?.plan ?? null;
}

export async function countOwnedActivePackages(
  freelancerId: string,
  client: CatalogClient = prisma,
): Promise<number> {
  return client.package.count({ where: { freelancer_id: freelancerId, deleted_at: null, is_active: true } });
}

export async function findActivePackageTier(
  tierId: string,
  client: CatalogClient = prisma,
): Promise<boolean> {
  const tier = await client.packageTier.findFirst({ where: { id: tierId, is_active: true }, select: { id: true } });
  return tier !== null;
}

export async function createPackage(
  freelancerId: string,
  input: CreatePackageRequest,
  client: CatalogClient = prisma,
): Promise<{ id: string }> {
  return client.package.create({
    data: {
      freelancer_id: freelancerId,
      tier_id: input.tier_id ?? null,
      title: input.title,
      description: input.description,
      price_mmk: BigInt(input.price_mmk),
      delivery_days: input.delivery_days,
      features: input.features ?? [],
    },
    select: { id: true },
  });
}

export async function findPackageById(
  id: string,
  client: CatalogClient = prisma,
): Promise<PackageRecord | null> {
  return client.package.findFirst({ where: { id, deleted_at: null }, select: packageSelect });
}

export async function findPublicPackageById(
  id: string,
): Promise<PackageRecord | null> {
  return prisma.package.findFirst({ where: { id, deleted_at: null, is_active: true }, select: packageSelect });
}

export async function findOwnedPackage(
  id: string,
  freelancerId: string,
  client: CatalogClient = prisma,
): Promise<PackageRecord | null> {
  return client.package.findFirst({ where: { id, freelancer_id: freelancerId, deleted_at: null }, select: packageSelect });
}

export async function updatePackage(
  id: string,
  input: UpdatePackageRequest,
  client: CatalogClient = prisma,
): Promise<void> {
  await client.package.update({
    where: { id },
    data: {
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.price_mmk === undefined ? {} : { price_mmk: BigInt(input.price_mmk) }),
      ...(input.delivery_days === undefined ? {} : { delivery_days: input.delivery_days }),
      ...(input.tier_id === undefined ? {} : { tier_id: input.tier_id }),
      ...(input.features === undefined ? {} : { features: input.features }),
      ...(input.is_active === undefined ? {} : { is_active: input.is_active }),
    },
  });
}

export async function setPackageEmbedding(
  id: string,
  vector: string,
  client: CatalogTransaction,
): Promise<void> {
  await client.$executeRaw`UPDATE packages SET embedding = ${vector}::vector WHERE id = ${id}::uuid`;
}

export async function softDeletePackage(
  id: string,
  freelancerId: string,
): Promise<void> {
  await prisma.package.updateMany({
    where: { id, freelancer_id: freelancerId, deleted_at: null },
    data: { deleted_at: new Date(), is_active: false },
  });
}

export async function listPackages(
  filters: PackageFilters,
): Promise<{ records: PackageRecord[]; total: number }> {
  const where: Prisma.PackageWhereInput = { deleted_at: null, is_active: true };
  if (filters.tier_id !== undefined) where.tier_id = filters.tier_id;
  if (filters.min_price_mmk !== undefined) where.price_mmk = { gte: BigInt(filters.min_price_mmk) };
  if (filters.max_price_mmk !== undefined) where.price_mmk = { ...(typeof where.price_mmk === 'object' ? where.price_mmk : {}), lte: BigInt(filters.max_price_mmk) };
  if (filters.search !== undefined) {
    where.OR = [{ title: { contains: filters.search, mode: 'insensitive' } }, { description: { contains: filters.search, mode: 'insensitive' } }];
  }
  const [records, total] = await prisma.$transaction([
    prisma.package.findMany({ where, select: packageSelect, orderBy: [{ created_at: 'desc' }, { id: 'desc' }], skip: (filters.page - 1) * filters.page_size, take: filters.page_size }),
    prisma.package.count({ where }),
  ]);
  return { records, total };
}
