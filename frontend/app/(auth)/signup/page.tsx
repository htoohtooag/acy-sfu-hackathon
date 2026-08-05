import type { Metadata } from "next";

import { SignupRolePicker } from "@/components/features/auth/signup-role-picker";

export const metadata: Metadata = { title: "Join TalentScout", description: "Choose how you want to use TalentScout." };

export default function SignupPage() { return <SignupRolePicker />; }
