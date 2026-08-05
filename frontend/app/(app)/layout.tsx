import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getServerCurrentUser } from "@/lib/auth/server-auth";
import { AppShell } from "@/components/shared/app-shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getServerCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "LEAD") redirect("/onboarding");
  return <AppShell>{children}</AppShell>;
}
