"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { dashboardSummarySchema, type DashboardRole, type DashboardSummary } from "shared/schemas";

import { authenticatedApiRequest } from "@/lib/api-client";
import { useAppStore, type AppRole } from "@/store/use-app-store";

export const dashboardSummaryQueryKey = (role: AppRole) => ["dashboard-summary", role] as const;

function toDashboardRole(role: AppRole): DashboardRole { return role === "CLIENT" ? "client" : "freelancer"; }

async function getDashboardSummary(role: AppRole, signal?: AbortSignal): Promise<DashboardSummary> {
  const query = new URLSearchParams({ role: toDashboardRole(role) });
  const data: unknown = await authenticatedApiRequest<unknown>(`/api/v1/dashboard?${query.toString()}`, { signal });
  return dashboardSummarySchema.parse(data);
}

export const dashboardSummaryQueryOptions = (role: AppRole) => queryOptions({
  queryKey: dashboardSummaryQueryKey(role),
  queryFn: ({ signal }) => getDashboardSummary(role, signal),
  staleTime: 30_000,
  refetchInterval: 30_000,
  refetchIntervalInBackground: false,
});

export function useDashboardSummary() {
  const activeRole = useAppStore((state) => state.activeRole);
  return useQuery(dashboardSummaryQueryOptions(activeRole));
}

export type { DashboardSummary };
