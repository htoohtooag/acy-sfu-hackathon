import { onboardingRequestSchema, type OnboardingRequest, type OnboardingResponse } from "shared/schemas";

import { authenticatedApiRequest } from "@/lib/api-client";
import { isCurrentUser, type CurrentUser } from "@/features/auth/auth-data";

export async function getCurrentUser(): Promise<CurrentUser> {
  const user = await authenticatedApiRequest<unknown>("/api/v1/users/me");
  if (!isCurrentUser(user)) throw new Error("The current user response was invalid.");
  return user;
}

export async function completeOnboarding(payload: OnboardingRequest): Promise<OnboardingResponse> {
  const validatedPayload = onboardingRequestSchema.parse(payload);
  return authenticatedApiRequest<OnboardingResponse>("/api/v1/users/me/onboarding", { method: "POST", body: JSON.stringify(validatedPayload) });
}

export type ExperienceLevel = { id: string; name: string; display_name: string | null; sort_order: number };

export async function getExperienceLevels(): Promise<ExperienceLevel[]> {
  return authenticatedApiRequest<ExperienceLevel[]>("/api/v1/lookups/experience-levels");
}
