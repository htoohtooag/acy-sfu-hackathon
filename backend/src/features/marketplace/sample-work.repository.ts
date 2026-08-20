import { prisma } from '../../config/prisma.js';
import type { Prisma } from '../../../prisma/generated/prisma/client.js';
import { sampleWorkSelect, type SampleWorkRecord } from './sample-work.types.js';

export type SampleWorkClient = Prisma.TransactionClient | typeof prisma;

export function findFreelancerIdByUserId(userId: string, client: SampleWorkClient = prisma): Promise<string | null> {
  return client.freelancerProfile.findFirst({ where: { user_id: userId, deleted_at: null }, select: { id: true } }).then((profile) => profile?.id ?? null);
}

export function listSampleWorks(freelancerId: string, client: SampleWorkClient = prisma): Promise<SampleWorkRecord[]> {
  return client.freelancerSampleWork.findMany({ where: { freelancer_id: freelancerId }, orderBy: [{ sort_order: 'asc' }, { id: 'asc' }], select: sampleWorkSelect });
}

export function findSampleWork(sampleId: string, freelancerId: string, client: SampleWorkClient = prisma): Promise<SampleWorkRecord | null> {
  return client.freelancerSampleWork.findFirst({ where: { id: sampleId, freelancer_id: freelancerId }, select: sampleWorkSelect });
}

export function createSampleWork(freelancerId: string, input: { title: string; description: string; tags: string[]; image_path: string; sort_order: number }, client: SampleWorkClient = prisma): Promise<SampleWorkRecord> {
  return client.freelancerSampleWork.create({ data: { freelancer_id: freelancerId, ...input }, select: sampleWorkSelect });
}

export function updateSampleWork(sampleId: string, freelancerId: string, input: Partial<{ title: string; description: string; tags: string[]; image_path: string }>, client: SampleWorkClient = prisma): Promise<SampleWorkRecord> {
  return client.freelancerSampleWork.update({ where: { id: sampleId }, data: input, select: sampleWorkSelect });
}

export function deleteSampleWork(sampleId: string, freelancerId: string, client: SampleWorkClient = prisma): Promise<SampleWorkRecord> {
  return client.freelancerSampleWork.delete({ where: { id: sampleId }, select: sampleWorkSelect });
}

export function countSampleWorks(freelancerId: string, client: SampleWorkClient = prisma): Promise<number> {
  return client.freelancerSampleWork.count({ where: { freelancer_id: freelancerId } });
}

export async function reorderSampleWorks(freelancerId: string, sampleIds: string[], client: Prisma.TransactionClient): Promise<SampleWorkRecord[]> {
  await client.freelancerSampleWork.updateMany({ where: { freelancer_id: freelancerId, id: { in: sampleIds } }, data: { sort_order: { increment: 100 } } });
  for (const [sortOrder, sampleId] of sampleIds.entries()) {
    await client.freelancerSampleWork.update({ where: { id: sampleId }, data: { sort_order: sortOrder }, select: sampleWorkSelect });
  }
  return listSampleWorks(freelancerId, client);
}
