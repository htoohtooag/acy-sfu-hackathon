import type { Metadata } from "next";

import { SignupAccountForm } from "@/components/features/auth/signup-account-form";

export const metadata: Metadata = { title: "Create your account | Gigmatch", description: "Create your Gigmatch account." };

export default function SignupAccountPage() { return <SignupAccountForm />; }
