import type { Metadata } from "next";

import { SignupRolePicker } from "@/components/features/auth/signup-role-picker";

export const metadata: Metadata = { title: "Join Gigmatch", description: "Choose how you want to use Gigmatch." };

export default function SignupPage() { return <SignupRolePicker />; }
