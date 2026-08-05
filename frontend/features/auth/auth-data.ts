import type { AuthRole } from "@/store/use-auth-store";

export type CurrentUser = { id: string; email: string; roles: string[]; status?: "LEAD" | "ACTIVE" | "SUSPENDED" | "DELETED" };

export function isCurrentUser(value: unknown): value is CurrentUser {
  if (typeof value !== "object" || value === null) return false;
  if (!("id" in value) || !("email" in value) || !("roles" in value)) return false;
  return typeof value.id === "string" && typeof value.email === "string" && Array.isArray(value.roles) && value.roles.every((role) => typeof role === "string");
}

export function routeForCurrentUser(user: CurrentUser): "/dashboard" | "/onboarding" {
  return user.status === "ACTIVE" || user.roles.length > 0 ? "/dashboard" : "/onboarding";
}

export function roleLabel(role: AuthRole): string {
  return role === "CLIENT" ? "I’m Hiring" : "I’m Looking for Work";
}
