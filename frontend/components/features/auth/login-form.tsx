"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthErrorState } from "@/components/features/auth/auth-error-state";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/features/auth/auth-api";
import { routeForCurrentUser } from "@/features/auth/auth-data";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signIn(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true); setError(null);
    try {
      const { error: signInError } = await createSupabaseBrowserClient().auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      const user = await getCurrentUser();
      router.push(routeForCurrentUser(user));
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "We could not log you in. Please try again.");
    } finally { setPending(false); }
  }

  async function signInWithGoogle(): Promise<void> {
    setPending(true); setError(null);
    try {
      const { error: oauthError } = await createSupabaseBrowserClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback` } });
      if (oauthError) throw oauthError;
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Google sign in is unavailable right now."); setPending(false);
    }
  }

  return <div className="w-full max-w-md space-y-8"><header className="space-y-3"><p className="text-sm font-semibold text-primary">Welcome back</p><h1 className="font-heading text-4xl font-semibold tracking-tight">Log in to TalentScout</h1><p className="text-muted-foreground">Pick up where you left off.</p></header>{error ? <AuthErrorState message={error} /> : null}<form onSubmit={signIn} className="space-y-6"><label className="block space-y-2"><span className="text-sm font-medium">Email</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full border-0 border-b border-input bg-transparent px-0 text-foreground outline-none focus:border-primary focus:ring-0" /></label><label className="block space-y-2"><span className="text-sm font-medium">Password</span><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full border-0 border-b border-input bg-transparent px-0 text-foreground outline-none focus:border-primary focus:ring-0" /></label><Button type="submit" disabled={pending} className="h-12 w-full rounded-full">{pending ? "Logging in…" : "Log in"}</Button></form><div className="relative flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div><Button type="button" variant="outline" disabled={pending} onClick={signInWithGoogle} className="h-12 w-full rounded-full">Continue with Google</Button><p className="text-center text-sm text-muted-foreground">New to TalentScout? <Link className="font-medium text-primary hover:underline" href="/signup">Create an account</Link></p></div>;
}
