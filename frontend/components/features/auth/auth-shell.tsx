import type { ReactNode } from "react";

import { AuthVisualPanel } from "@/components/features/auth/auth-visual-panel";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,0.9fr)_minmax(32rem,1.1fr)]">
      <AuthVisualPanel />
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10 lg:px-16">{children}</section>
    </main>
  );
}
