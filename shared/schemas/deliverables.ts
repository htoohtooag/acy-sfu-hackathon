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
