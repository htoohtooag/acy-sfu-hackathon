"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createReviewSchema,
  deliverableDecisionResponseSchema,
  deliverableDecisionSchema,
  deliverableSubmissionResponseSchema,
  reviewResponseSchema,
  type CreateReviewRequest,
  type DeliverableDecisionResponse,
  type DeliverableSubmissionResponse,
  type ReviewResponse,
} from "shared/schemas";

import { authenticatedApiRequest } from "@/lib/api-client";

type DeliverableSubmissionInput = {
  orderId: string;
  file: File;
};

type DeliverableDecisionInput = {
  orderId: string;
  deliverableId: string;
  action: "APPROVE" | "REJECT";
};

type ReviewInput = {
  orderId: string;
  review: CreateReviewRequest;
};

async function submitDeliverable(input: DeliverableSubmissionInput): Promise<DeliverableSubmissionResponse> {
  const form = new FormData();
  form.append("file", input.file);
  const data: unknown = await authenticatedApiRequest<unknown>(`/api/v1/orders/${encodeURIComponent(input.orderId)}/deliverables`, {
    method: "POST",
    body: form,
  });
  return deliverableSubmissionResponseSchema.parse(data);
}

async function decideDeliverable(input: DeliverableDecisionInput): Promise<DeliverableDecisionResponse> {
  const body = deliverableDecisionSchema.parse({ action: input.action });
  const data: unknown = await authenticatedApiRequest<unknown>(`/api/v1/orders/${encodeURIComponent(input.orderId)}/deliverables/${encodeURIComponent(input.deliverableId)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return deliverableDecisionResponseSchema.parse(data);
}

async function createReview(input: ReviewInput): Promise<ReviewResponse> {
  const review = createReviewSchema.parse(input.review);
  const data: unknown = await authenticatedApiRequest<unknown>(`/api/v1/orders/${encodeURIComponent(input.orderId)}/reviews`, {
    method: "POST",
    body: JSON.stringify(review),
  });
  return reviewResponseSchema.parse(data);
}

function invalidateWorkroomQueries(queryClient: ReturnType<typeof useQueryClient>, orderId: string): void {
  void queryClient.invalidateQueries({ queryKey: ["workroom-orders"] });
  void queryClient.invalidateQueries({ queryKey: ["workroom-messages", orderId] });
  void queryClient.invalidateQueries({ queryKey: ["workroom-order-detail", orderId] });
  void queryClient.invalidateQueries({ queryKey: ["recent-workrooms"] });
}

export function useSubmitDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitDeliverable,
    onSuccess: (response) => invalidateWorkroomQueries(queryClient, response.order_id),
  });
}

export function useDecideDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: decideDeliverable,
    onSuccess: (response) => invalidateWorkroomQueries(queryClient, response.order_id),
  });
}

export function useCreateWorkroomReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReview,
    onSuccess: (response) => invalidateWorkroomQueries(queryClient, response.order_id),
  });
}

export type { DeliverableDecisionInput, DeliverableSubmissionInput, ReviewInput };
