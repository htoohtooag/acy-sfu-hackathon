"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import type { OrderListItem } from "shared/schemas";

import { authenticatedApiRequest } from "@/lib/api-client";
import { useAppStore, type AppRole } from "@/store/use-app-store";
import { normalizeAppUser, normalizeRecentWorkroom, type AppUser, type RecentWorkroom } from "./app-types";

async function getCurrentUser(signal?: AbortSignal): Promise<AppUser> {
  const data: unknown = await authenticatedApiRequest<unknown>("/api/v1/users/me", { signal });
  const user = normalizeAppUser(data);
  if (!user) throw new Error("The current user response was not valid.");
  return user;
}

async function getRecentOrders(role: AppRole, signal?: AbortSignal): Promise<RecentWorkroom[]> {
  try {
    const data: unknown = await authenticatedApiRequest<unknown>(`/api/v1/orders?role=${role.toLowerCase()}&status=active`, { signal });
    if (!Array.isArray(data)) return [];
    return data.map(normalizeRecentWorkroom).filter((item): item is RecentWorkroom => item !== null).slice(0, 3);
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return [];
  }
}

export const currentUserQueryOptions = queryOptions({
  queryKey: ["current-user"],
  queryFn: ({ signal }) => getCurrentUser(signal),
  staleTime: 60_000,
});

export const recentWorkroomsQueryOptions = (role: AppRole) => queryOptions({
  queryKey: ["recent-workrooms", role],
  queryFn: ({ signal }) => getRecentOrders(role, signal),
  staleTime: 30_000,
});

export function useCurrentUser() {
  return useQuery(currentUserQueryOptions);
}

export function useRecentWorkrooms() {
  const activeRole = useAppStore((state) => state.activeRole);
  return useQuery(recentWorkroomsQueryOptions(activeRole));
}

export type { OrderListItem };
