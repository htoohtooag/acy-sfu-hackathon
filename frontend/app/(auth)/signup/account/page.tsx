import type { Metadata } from "next";

import { SignupAccountForm } from "@/components/features/auth/signup-account-form";

export const metadata: Metadata = { title: "Create your account | TalentScout", description: "Create your TalentScout account." };

export default function SignupAccountPage() { return <SignupAccountForm />; }
