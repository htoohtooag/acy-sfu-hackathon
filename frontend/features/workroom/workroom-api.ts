"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import type { OrderDetail, OrderListItem, WorkroomMessageHistory } from "shared/schemas";
import { orderDetailSchema, orderListResponseSchema, workroomMessageHistorySchema } from "shared/schemas";

import { authenticatedApiRequest } from "@/lib/api-client";
import { useAppStore, type AppRole } from "@/store/use-app-store";

export const workroomOrdersQueryKey = (role: AppRole) => ["workroom-orders", role] as const;
export const workroomMessagesQueryKey = (orderId: string) => ["workroom-messages", orderId] as const;
export const workroomOrderDetailQueryKey = (orderId: string) => ["workroom-order-detail", orderId] as const;

async function getWorkroomOrders(role: AppRole, signal?: AbortSignal): Promise<OrderListItem[]> {
  const queryRole = role.toLowerCase();
  const data: unknown = await authenticatedApiRequest<unknown>(`/api/v1/orders?role=${queryRole}`, { signal });
  return orderListResponseSchema.parse(data);
}

async function getWorkroomMessages(orderId: string, signal?: AbortSignal): Promise<WorkroomMessageHistory> {
  const data: unknown = await authenticatedApiRequest<unknown>(
    `/api/v1/orders/${encodeURIComponent(orderId)}/messages?page=1&page_size=50`,
    { signal },
  );
  return workroomMessageHistorySchema.parse(data);
}

async function getWorkroomOrderDetail(orderId: string, signal?: AbortSignal): Promise<OrderDetail> {
  const data: unknown = await authenticatedApiRequest<unknown>(`/api/v1/orders/${encodeURIComponent(orderId)}`, { signal });
  return orderDetailSchema.parse(data);
}

export const workroomOrdersQueryOptions = (role: AppRole) => queryOptions({
  queryKey: workroomOrdersQueryKey(role),
  queryFn: ({ signal }) => getWorkroomOrders(role, signal),
  staleTime: 30_000,
  refetchInterval: 30_000,
  refetchIntervalInBackground: false,
});

export const workroomMessagesQueryOptions = (orderId: string) => queryOptions({
  queryKey: workroomMessagesQueryKey(orderId),
  queryFn: ({ signal }) => getWorkroomMessages(orderId, signal),
  enabled: orderId.length > 0,
  staleTime: 15_000,
});

export const workroomOrderDetailQueryOptions = (orderId: string) => queryOptions({
  queryKey: workroomOrderDetailQueryKey(orderId),
  queryFn: ({ signal }) => getWorkroomOrderDetail(orderId, signal),
  enabled: orderId.length > 0,
  staleTime: 15_000,
});

export function useWorkroomOrders() {
  const activeRole = useAppStore((state) => state.activeRole);
  return useQuery(workroomOrdersQueryOptions(activeRole));
}

export function useWorkroomMessages(orderId: string | null) {
  return useQuery(workroomMessagesQueryOptions(orderId ?? ""));
}

export function useWorkroomOrderDetail(orderId: string | null) {
  return useQuery(workroomOrderDetailQueryOptions(orderId ?? ""));
}

export type { OrderDetail, OrderListItem, WorkroomMessageHistory };
