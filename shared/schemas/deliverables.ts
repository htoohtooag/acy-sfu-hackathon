import { z } from 'zod';

export const deliverableOrderParamsSchema = z
  .object({ id: z.uuid() })
  .strict();

export const deliverableDecisionParamsSchema = z
  .object({
    id: z.uuid(),
    deliverableId: z.uuid(),
  })
  .strict();

export const deliverableDecisionSchema = z
  .object({
    action: z.enum(['APPROVE', 'REJECT']),
  })
  .strict();

export const deliverableSubmissionResponseSchema = z
  .object({
    deliverable_id: z.uuid(),
    order_id: z.uuid(),
    file_name: z.string(),
    file_size_bytes: z.string(),
    deliverable_status: z.literal('UNDER_REVIEW'),
    order_status: z.literal('IN_REVIEW'),
    submitted_at: z.iso.datetime({ offset: true }),
    watermarked_url: z.url(),
  })
  .strict();

export const deliverablePreviewResponseSchema = z
  .object({
    deliverable_id: z.uuid(),
    watermarked_url: z.url(),
  })
  .strict();

export const deliverableDownloadResponseSchema = z
  .object({
    deliverable_id: z.uuid(),
    file_name: z.string(),
    clean_url: z.url(),
  })
  .strict();

export const deliverableApprovalResponseSchema = z
  .object({
    deliverable_id: z.uuid(),
    order_id: z.uuid(),
    deliverable_status: z.literal('APPROVED'),
    order_status: z.literal('COMPLETED'),
    approved_at: z.iso.datetime({ offset: true }),
    clean_url: z.url(),
  })
  .strict();

export const deliverableRejectionResponseSchema = z
  .object({
    deliverable_id: z.uuid(),
    order_id: z.uuid(),
    deliverable_status: z.literal('REJECTED'),
    order_status: z.literal('ACTIVE'),
  })
  .strict();

export const deliverableDecisionResponseSchema = z.union([
  deliverableApprovalResponseSchema,
  deliverableRejectionResponseSchema,
]);

export const deliverableSubmittedEventSchema = z
  .object({
    deliverable_id: z.uuid(),
    order_id: z.uuid(),
    watermarked_url: z.url(),
  })
  .strict();

export const deliverableUnlockedEventSchema = z
  .object({
    deliverable_id: z.uuid(),
    order_id: z.uuid(),
    clean_url: z.url(),
  })
  .strict();

export type DeliverableDecisionRequest = z.infer<typeof deliverableDecisionSchema>;

export type DeliverableSubmissionResponse = {
  deliverable_id: string;
  order_id: string;
  file_name: string;
  file_size_bytes: string;
  deliverable_status: 'UNDER_REVIEW';
  order_status: 'IN_REVIEW';
  submitted_at: string;
  watermarked_url: string;
};

export type DeliverablePreviewResponse = {
  deliverable_id: string;
  watermarked_url: string;
};

export type DeliverableDownloadResponse = {
  deliverable_id: string;
  file_name: string;
  clean_url: string;
};

export type DeliverableApprovalResponse = {
  deliverable_id: string;
  order_id: string;
  deliverable_status: 'APPROVED';
  order_status: 'COMPLETED';
  approved_at: string;
  clean_url: string;
};

export type DeliverableRejectionResponse = {
  deliverable_id: string;
  order_id: string;
  deliverable_status: 'REJECTED';
  order_status: 'ACTIVE';
};

export type DeliverableDecisionResponse =
  | DeliverableApprovalResponse
  | DeliverableRejectionResponse;

export type DeliverableSubmittedEvent = {
  deliverable_id: string;
  order_id: string;
  watermarked_url: string;
};

export type DeliverableUnlockedEvent = {
  deliverable_id: string;
  order_id: string;
  clean_url: string;
};
