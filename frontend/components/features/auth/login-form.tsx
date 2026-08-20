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

  return <div className="w-full max-w-md space-y-8">
    <header className="space-y-3">
      <p className="text-sm font-semibold text-primary">Welcome back</p>
      <h1 className="font-heading text-4xl font-semibold tracking-tight">Log in to Gigmatch</h1>
      <p className="text-muted-foreground">Pick up where you left off.</p>
    </header>
    {error ? <AuthErrorState message={error} /> : null}
    <form onSubmit={signIn} className="space-y-6">
      <label className="block space-y-2">
        <span className="text-sm font-medium">Email</span>
        <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full border-0 border-b border-input bg-transparent px-0 text-foreground outline-none focus:border-primary focus:ring-0" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Password</span>
        <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full border-0 border-b border-input bg-transparent px-0 text-foreground outline-none focus:border-primary focus:ring-0" />
    </label><Button type="submit" disabled={pending} className="h-12 w-full rounded-full">{pending ? "Logging in…" : "Log in"}</Button></form><div className="relative flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div><Button type="button" variant="outline" disabled={pending} onClick={signInWithGoogle} className="h-12 w-full rounded-full">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" role="img">
              <path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z" />
              <path fill="#34A853" d="M12 21.67c2.63 0 4.84-.87 6.45-2.37l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.67Z" />
              <path fill="#FBBC05" d="M6.54 13.75A5.85 5.85 0 0 1 6.23 12c0-.61.11-1.2.31-1.75V7.72H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.06 1.05 4.28l3.24-2.53Z" />
              <path fill="#EA4335" d="M12 6.22c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.31 14.63 2.33 12 2.33a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53c.77-2.31 2.92-4.03 5.46-4.03Z" />
            </svg>
            Continue with Google
          </Button><p className="text-center text-sm text-muted-foreground">New to Gigmatch? <Link className="font-medium text-primary hover:underline" href="/signup">Create an account</Link></p></div>;
}
