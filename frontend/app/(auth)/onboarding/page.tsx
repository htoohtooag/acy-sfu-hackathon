import type { Metadata } from "next";

import { OnboardingWizard } from "@/components/features/onboarding/onboarding-wizard";
import { getServerCurrentUser } from "@/lib/auth/server-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Complete your profile | Gigmatch", description: "Tell Gigmatch what you do and what you need." };

export default async function OnboardingPage() {
  const user = await getServerCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "ACTIVE") redirect("/dashboard");
  return <OnboardingWizard />;
}
