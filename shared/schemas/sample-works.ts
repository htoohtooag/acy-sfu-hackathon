import { z } from 'zod';

export const sampleWorkIdSchema = z.object({ sampleId: z.uuid() }).strict();

export const sampleWorkTextSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
  tags: z.array(z.string().trim().min(1).max(50)).max(10).default([]),
}).strict();

export const sampleWorkUpdateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().min(1).max(1000).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
}).strict();

export const sampleWorkOrderSchema = z.object({
  sampleIds: z.array(z.uuid()).min(1).max(6),
}).strict().refine((value) => new Set(value.sampleIds).size === value.sampleIds.length, {
  message: 'Sample work IDs must be unique.',
});

export type SampleWorkText = z.infer<typeof sampleWorkTextSchema>;
export type SampleWorkUpdate = z.infer<typeof sampleWorkUpdateSchema>;
export type SampleWorkOrder = z.infer<typeof sampleWorkOrderSchema>;

export type FreelancerSampleWork = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image_url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type FreelancerSampleWorkList = {
  items: FreelancerSampleWork[];
  limit: 6;
};
