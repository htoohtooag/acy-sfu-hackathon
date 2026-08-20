import type { FreelancerSampleWork, FreelancerSampleWorkList, FreelancerPublicSampleWork } from 'shared/schemas';
import type { Prisma } from '../../../prisma/generated/prisma/client.js';

export const sampleWorkSelect = {
  id: true,
  title: true,
  description: true,
  tags: true,
  image_path: true,
  sort_order: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.FreelancerSampleWorkSelect;

export type SampleWorkRecord = Prisma.FreelancerSampleWorkGetPayload<{ select: typeof sampleWorkSelect }>;

export function mapSampleWork(record: SampleWorkRecord, imageUrl: string): FreelancerSampleWork {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    tags: record.tags,
    image_url: imageUrl,
    sort_order: record.sort_order,
    created_at: record.created_at.toISOString(),
    updated_at: record.updated_at.toISOString(),
  };
}

export function mapPublicSampleWork(record: SampleWorkRecord, imageUrl: string): FreelancerPublicSampleWork {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    tags: record.tags,
    image_url: imageUrl,
    sort_order: record.sort_order,
  };
}

export function mapSampleWorkList(items: FreelancerSampleWork[]): FreelancerSampleWorkList {
  return { items, limit: 6 };
}
