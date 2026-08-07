import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getServerCurrentUser } from "@/lib/auth/server-auth";
import { AppShell } from "@/components/shared/app-shell";
import { AiSearchChatProvider } from "@/components/features/ai-search/ai-search-chat-provider";
import { FloatingAiButton } from "@/components/features/ai-search/floating-ai-button";

export default async function AppLayout({ children, modal }: { children: ReactNode; modal?: ReactNode }) {
  const user = await getServerCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "LEAD") redirect("/onboarding");
  return <><AppShell>{children}</AppShell><AiSearchChatProvider><FloatingAiButton /></AiSearchChatProvider>{modal ?? null}</>;
}
