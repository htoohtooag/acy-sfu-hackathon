import type { Metadata } from "next";

import { LoginForm } from "@/components/features/auth/login-form";

export const metadata: Metadata = { title: "Log in | TalentScout", description: "Log in to your TalentScout account." };

export default function LoginPage() {
  return <LoginForm />;
}
