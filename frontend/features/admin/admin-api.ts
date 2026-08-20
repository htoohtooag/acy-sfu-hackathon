"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminPaymentDetailSchema,
  adminPaymentListResponseSchema,
  adminSessionResponseSchema,
  type AdminPaymentDetail,
  type AdminPaymentListResponse,
  type AdminSessionResponse,
} from "shared/schemas";

import { authenticatedApiRequest } from "@/lib/api-client";

function parse<T>(value: unknown, schema: { safeParse: (input: unknown) => { success: boolean; data?: T } }, message: string): T {
  const result = schema.safeParse(value);
  if (!result.success || result.data === undefined) throw new Error(message);
  return result.data;
}

async function getAdminSession(signal?: AbortSignal): Promise<AdminSessionResponse> {
  return parse(await authenticatedApiRequest<unknown>("/api/v1/admin/me", { signal }), adminSessionResponseSchema, "The admin session response was not valid.");
}

async function getAdminPayments(page: number, signal?: AbortSignal): Promise<AdminPaymentListResponse> {
  const params = new URLSearchParams({ page: String(page), page_size: "20" });
  return parse(await authenticatedApiRequest<unknown>(`/api/v1/admin/payments?${params.toString()}`, { signal }), adminPaymentListResponseSchema, "The admin payment list response was not valid.");
}

async function getAdminPayment(paymentId: string, signal?: AbortSignal): Promise<AdminPaymentDetail> {
  return parse(await authenticatedApiRequest<unknown>(`/api/v1/admin/payments/${encodeURIComponent(paymentId)}`, { signal }), adminPaymentDetailSchema, "The admin payment detail response was not valid.");
}

async function decidePayment(input: { paymentId: string; action: "VERIFY" } | { paymentId: string; action: "REJECT"; reason: string }): Promise<unknown> {
  const body = input.action === "REJECT" ? { action: input.action, reason: input.reason } : { action: input.action };
  return authenticatedApiRequest<unknown>(`/api/v1/admin/payments/${encodeURIComponent(input.paymentId)}`, { method: "PATCH", body: JSON.stringify(body) });
}

export const adminSessionQueryOptions = queryOptions({
  queryKey: ["admin-session"] as const,
  queryFn: ({ signal }) => getAdminSession(signal),
  staleTime: 60_000,
  retry: false,
});

export const adminPaymentsQueryOptions = (page: number) => queryOptions({
  queryKey: ["admin-payments", page] as const,
  queryFn: ({ signal }) => getAdminPayments(page, signal),
  staleTime: 10_000,
  retry: false,
});

export const adminPaymentQueryOptions = (paymentId: string | null) => queryOptions({
  queryKey: ["admin-payment", paymentId] as const,
  queryFn: ({ signal }) => getAdminPayment(paymentId as string, signal),
  enabled: paymentId !== null,
  retry: false,
});

export function useAdminSession() {
  return useQuery(adminSessionQueryOptions);
}

export function useAdminPayments(page: number) {
  return useQuery(adminPaymentsQueryOptions(page));
}

export function useAdminPayment(paymentId: string | null) {
  return useQuery(adminPaymentQueryOptions(paymentId));
}

export function useDecideAdminPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: decidePayment,
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    },
  });
}
