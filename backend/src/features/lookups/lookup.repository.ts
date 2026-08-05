import { prisma } from '../../config/prisma.js';
import type { ExperienceLevelLookup } from './lookup.types.js';

export async function findActiveExperienceLevels(): Promise<ExperienceLevelLookup[]> {
  return prisma.experienceLevel.findMany({
    where: { is_active: true },
    orderBy: { sort_order: 'asc' },
    select: { id: true, name: true, display_name: true, sort_order: true },
  });
}
