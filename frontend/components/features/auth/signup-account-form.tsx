"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthErrorState } from "@/components/features/auth/auth-error-state";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { env } from "@/lib/env";
import { roleLabel } from "@/features/auth/auth-data";
import { useAuthStore } from "@/store/use-auth-store";

export function SignupAccountForm() {
  const router = useRouter();
  const role = useAuthStore((state) => state.selectedRole);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState<string | null>(null); const [pending, setPending] = useState(false);

  async function signUp(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setPending(true); setError(null);
    try {
      if (!role) { router.replace("/signup"); return; }
      const { error: signUpError } = await createSupabaseBrowserClient().auth.signUp({ email, password, options: { data: { selected_role: role }, emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback` } });
      if (signUpError) throw signUpError;
      router.push("/onboarding");
    } catch (caught: unknown) {
      const message = caught instanceof Error ? caught.message : "We could not create your account.";
      setError(message.toLowerCase().includes("already") || message.toLowerCase().includes("registered") ? "This email is already registered." : message);
    } finally { setPending(false); }
  }

  async function signUpWithGoogle(): Promise<void> {
    setPending(true); setError(null);
    try {
      if (!role) { router.replace("/signup"); return; }
      const { error: oauthError } = await createSupabaseBrowserClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback`, queryParams: { access_type: "offline", prompt: "consent" } } });
      if (oauthError) throw oauthError;
    } catch (caught: unknown) { setError(caught instanceof Error ? caught.message : "Google sign up is unavailable right now."); setPending(false); }
  }

  if (!role) return <div className="w-full max-w-md space-y-5"><h1 className="font-heading text-3xl font-semibold">Choose a path first</h1><Button type="button" className="rounded-full" onClick={() => router.replace("/signup")}>Back to role selection</Button></div>;
  return <div className="w-full max-w-md space-y-8"><header className="space-y-3"><p className="text-sm font-semibold text-primary">{roleLabel(role)}</p><h1 className="font-heading text-4xl font-semibold tracking-tight">Create your account</h1><p className="text-muted-foreground">A few details now, then we’ll help you finish your profile.</p></header>{error ? <AuthErrorState message={error} duplicate={error === "This email is already registered."} /> : null}<form onSubmit={signUp} className="space-y-6"><label className="block space-y-2"><span className="text-sm font-medium">Email</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full border-0 border-b border-input bg-transparent px-0 outline-none focus:border-primary" /></label><label className="block space-y-2"><span className="text-sm font-medium">Password</span><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full border-0 border-b border-input bg-transparent px-0 outline-none focus:border-primary" /></label><Button type="submit" disabled={pending} className="h-12 w-full rounded-full">{pending ? "Creating account…" : "Create account"}</Button></form><div className="relative flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div><Button type="button" variant="outline" disabled={pending} onClick={signUpWithGoogle} className="h-12 w-full rounded-full">Continue with Google</Button><p className="text-center text-sm text-muted-foreground">Already registered? <Link className="font-medium text-primary hover:underline" href="/login">Go to Login</Link></p></div>;
}
