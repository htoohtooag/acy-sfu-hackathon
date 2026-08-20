"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReviewSchema,
  deliverablePreviewResponseSchema,
  deliverableDecisionResponseSchema,
  deliverableDecisionSchema,
  deliverableDownloadResponseSchema,
  deliverableSubmissionResponseSchema,
  reviewResponseSchema,
  reviewStatusResponseSchema,
  type CreateReviewRequest,
  type DeliverableDecisionResponse,
  type DeliverableDownloadResponse,
  type DeliverablePreviewResponse,
  type DeliverableSubmissionResponse,
  type ReviewResponse,
  type ReviewStatusResponse,
} from "shared/schemas";
import type { OrderDetail, OrderListItem } from "shared/schemas";

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

async function getWatermarkedDeliverablePreview(orderId: string, deliverableId: string): Promise<DeliverablePreviewResponse> {
  const data: unknown = await authenticatedApiRequest<unknown>(`/api/v1/orders/${encodeURIComponent(orderId)}/deliverables/${encodeURIComponent(deliverableId)}/preview`);
  return deliverablePreviewResponseSchema.parse(data);
}

async function getCleanDeliverableDownload(orderId: string, deliverableId: string): Promise<DeliverableDownloadResponse> {
  const data: unknown = await authenticatedApiRequest<unknown>(`/api/v1/orders/${encodeURIComponent(orderId)}/deliverables/${encodeURIComponent(deliverableId)}/download`);
  return deliverableDownloadResponseSchema.parse(data);
}

async function createReview(input: ReviewInput): Promise<ReviewResponse> {
  const review = createReviewSchema.parse(input.review);
  const data: unknown = await authenticatedApiRequest<unknown>(`/api/v1/orders/${encodeURIComponent(input.orderId)}/reviews`, {
    method: "POST",
    body: JSON.stringify(review),
  });
  return reviewResponseSchema.parse(data);
}

async function getReviewStatus(orderId: string): Promise<ReviewStatusResponse> {
  const data: unknown = await authenticatedApiRequest<unknown>(`/api/v1/orders/${encodeURIComponent(orderId)}/reviews`);
  return reviewStatusResponseSchema.parse(data);
}

function invalidateWorkroomQueries(queryClient: ReturnType<typeof useQueryClient>, orderId: string): void {
  void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  void queryClient.invalidateQueries({ queryKey: ["workroom-orders"] });
  void queryClient.invalidateQueries({ queryKey: ["workroom-messages", orderId] });
  void queryClient.invalidateQueries({ queryKey: ["workroom-order-detail", orderId] });
  void queryClient.invalidateQueries({ queryKey: ["recent-workrooms"] });
}

function updateOrderStatus(queryClient: ReturnType<typeof useQueryClient>, orderId: string, status: OrderListItem["status"]): void {
  queryClient.setQueriesData<OrderListItem[]>({ queryKey: ["workroom-orders"] }, (orders) => {
    if (!orders) return orders;
    return orders.map((order) => order.id === orderId ? { ...order, status } : order);
  });
  queryClient.setQueryData<OrderDetail>(["workroom-order-detail", orderId], (detail) => detail ? { ...detail, status } : detail);
}

function updateDeliverableStatus(queryClient: ReturnType<typeof useQueryClient>, response: DeliverableDecisionResponse): void {
  queryClient.setQueryData<OrderDetail>(["workroom-order-detail", response.order_id], (detail) => {
    if (!detail) return detail;
    return {
      ...detail,
      deliverables: detail.deliverables.map((deliverable) => deliverable.id === response.deliverable_id
        ? {
          ...deliverable,
          status: response.deliverable_status,
          approved_at: response.deliverable_status === "APPROVED" ? response.approved_at : null,
        }
        : deliverable),
    };
  });
}

export function useSubmitDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitDeliverable,
    onSuccess: (response) => {
      updateOrderStatus(queryClient, response.order_id, response.order_status);
      queryClient.setQueryData<OrderDetail>(["workroom-order-detail", response.order_id], (detail) => {
        if (!detail || detail.deliverables.some((deliverable) => deliverable.id === response.deliverable_id)) return detail;
        return {
          ...detail,
          deliverables: [...detail.deliverables, {
            id: response.deliverable_id,
            file_name: response.file_name,
            file_size_bytes: response.file_size_bytes,
            status: response.deliverable_status,
            submitted_at: response.submitted_at,
            approved_at: null,
          }],
        };
      });
      invalidateWorkroomQueries(queryClient, response.order_id);
    },
  });
}

export function useWatermarkedDeliverablePreview(orderId: string | null, deliverableId: string | null) {
  return useQuery({
    queryKey: ['workroom-deliverable-preview', orderId, deliverableId],
    queryFn: () => getWatermarkedDeliverablePreview(orderId ?? '', deliverableId ?? ''),
    enabled: orderId !== null && deliverableId !== null,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

export function useCleanDeliverableDownload(orderId: string | null, deliverableId: string | null) {
  return useQuery({
    queryKey: ["workroom-deliverable-download", orderId, deliverableId],
    queryFn: () => getCleanDeliverableDownload(orderId ?? "", deliverableId ?? ""),
    enabled: orderId !== null && deliverableId !== null,
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });
}

export function useDecideDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: decideDeliverable,
    onSuccess: (response) => {
      updateOrderStatus(queryClient, response.order_id, response.order_status);
      updateDeliverableStatus(queryClient, response);
      invalidateWorkroomQueries(queryClient, response.order_id);
    },
  });
}

export function useCreateWorkroomReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReview,
      onSuccess: (response) => {
        void queryClient.invalidateQueries({ queryKey: ["workroom-review-status", response.order_id] });
        invalidateWorkroomQueries(queryClient, response.order_id);
      },
  });
}

export function useWorkroomReviewStatus(orderId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["workroom-review-status", orderId],
    queryFn: () => getReviewStatus(orderId ?? ""),
    enabled: enabled && orderId !== null,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export type { DeliverableDecisionInput, DeliverableSubmissionInput, ReviewInput };
