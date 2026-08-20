import type { Metadata } from "next";

import { LoginForm } from "@/components/features/auth/login-form";

export const metadata: Metadata = { title: "Log in | Gigmatch", description: "Log in to your Gigmatch account." };

export default function LoginPage() {
  return <LoginForm />;
}
