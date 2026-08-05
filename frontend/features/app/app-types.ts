import type { OrderListItem } from "shared/schemas";

export type AppRole = "CLIENT" | "FREELANCER";
export type PlanLevel = "FREE" | "GOLD" | "DIAMOND";

export type AppUser = {
  id: string;
  email: string;
  roles: AppRole[];
  status?: "LEAD" | "ACTIVE" | "SUSPENDED" | "DELETED";
  fullName: string | null;
  avatarUrl: string | null;
  planLevel: PlanLevel;
};

export type RecentWorkroom = {
  id: string;
  title: string;
  participantName: string;
  participantAvatarUrl: string | null;
  status: OrderListItem["status"];
};

const roles = new Set<AppRole>(["CLIENT", "FREELANCER"]);
const plans = new Set<PlanLevel>(["FREE", "GOLD", "DIAMOND"]);

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && roles.has(value as AppRole);
}

export function normalizeAppUser(value: unknown): AppUser | null {
  if (typeof value !== "object" || value === null || !("id" in value) || !("email" in value) || !("roles" in value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || typeof record.email !== "string" || !Array.isArray(record.roles)) return null;
  const normalizedRoles = record.roles.filter(isAppRole);
  if (normalizedRoles.length === 0) return null;
  const planLevel = typeof record.plan_level === "string" && plans.has(record.plan_level as PlanLevel) ? record.plan_level as PlanLevel : "FREE";
  return {
    id: record.id,
    email: record.email,
    roles: normalizedRoles,
    status: record.status === "ACTIVE" || record.status === "LEAD" || record.status === "SUSPENDED" || record.status === "DELETED" ? record.status : undefined,
    fullName: typeof record.full_name === "string" ? record.full_name : null,
    avatarUrl: typeof record.avatar_url === "string" ? record.avatar_url : null,
    planLevel,
  };
}

export function normalizeRecentWorkroom(value: unknown): RecentWorkroom | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const otherParty = typeof record.other_party === "object" && record.other_party !== null ? record.other_party as Record<string, unknown> : null;
  const source = typeof record.source === "object" && record.source !== null ? record.source as Record<string, unknown> : null;
  if (typeof record.id !== "string" || typeof record.status !== "string") return null;
  return {
    id: record.id,
    title: typeof source?.title === "string" ? source.title : "Active workroom",
    participantName: typeof otherParty?.full_name === "string" ? otherParty.full_name : "Your collaborator",
    participantAvatarUrl: typeof otherParty?.avatar_url === "string" ? otherParty.avatar_url : null,
    status: record.status as RecentWorkroom["status"],
  };
}
