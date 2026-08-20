import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/features/admin/admin-shell";
import { getServerAdminSession } from "@/lib/auth/server-auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerAdminSession();
  if (!session || !session.capabilities.includes("PAYMENT_REVIEW")) redirect("/dashboard");
  return <AdminShell displayName={session.display_name}>{children}</AdminShell>;
}
