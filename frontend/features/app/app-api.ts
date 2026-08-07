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

async function getRecentOrders(role: AppRole, currentUserId: string | null, currentUserName: string | null, signal?: AbortSignal): Promise<RecentWorkroom[]> {
  try {
    const data: unknown = await authenticatedApiRequest<unknown>(`/api/v1/orders?role=${role.toLowerCase()}&status=active`, { signal });
    if (!Array.isArray(data)) return [];
    return data.map((item) => normalizeRecentWorkroom(item, role, currentUserId, currentUserName)).filter((item): item is RecentWorkroom => item !== null).slice(0, 3);
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

export const recentWorkroomsQueryOptions = (role: AppRole, currentUserId: string | null, currentUserName: string | null) => queryOptions({
  queryKey: ["recent-workrooms", role, currentUserId, currentUserName],
  queryFn: ({ signal }) => getRecentOrders(role, currentUserId, currentUserName, signal),
  staleTime: 30_000,
});

export function useCurrentUser() {
  return useQuery(currentUserQueryOptions);
}

export function useRecentWorkrooms() {
  const activeRole = useAppStore((state) => state.activeRole);
  const { data: currentUser } = useCurrentUser();
  return useQuery(recentWorkroomsQueryOptions(activeRole, currentUser?.id ?? null, currentUser?.fullName ?? null));
}

export type { OrderListItem };
