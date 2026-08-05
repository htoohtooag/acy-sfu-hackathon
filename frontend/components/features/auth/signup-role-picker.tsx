"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { useAuthStore, type AuthRole } from "@/store/use-auth-store";

const roles: Array<{ value: AuthRole; title: string; description: string; mascot: string }> = [
  { value: "CLIENT", title: "I’m Hiring", description: "Find trusted people to move your next idea forward.", mascot: "/masscot/mascot-auth2.png" },
  { value: "FREELANCER", title: "I’m Looking for Work", description: "Show your skills and find work that fits you.", mascot: "/masscot/mascot-auth.png" },
];

export function SignupRolePicker() {
  const router = useRouter();
  const setSelectedRole = useAuthStore((state) => state.setSelectedRole);

  function chooseRole(role: AuthRole): void { setSelectedRole(role); router.push("/signup/account"); }

  return <div className="w-full max-w-2xl space-y-8"><header className="space-y-3"><p className="text-sm font-semibold text-primary">Start your journey</p><h1 className="font-heading text-4xl font-semibold tracking-tight">How will you use TalentScout?</h1><p className="text-muted-foreground">You can always grow into both sides of the marketplace later.</p></header><div className="grid gap-4 sm:grid-cols-2">{roles.map((role) => <button key={role.value} type="button" onClick={() => chooseRole(role.value)} className={cn("group relative min-h-72 overflow-hidden rounded-3xl border border-border bg-card p-6 text-left transition hover:-translate-y-1 hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50")}><div className="relative z-10 flex h-full flex-col justify-between"><div><p className="text-2xl font-semibold">{role.title}</p><p className="mt-3 max-w-56 text-sm text-muted-foreground">{role.description}</p></div><span className="text-sm font-medium text-primary">Choose this path →</span></div><Image src={role.mascot} alt="" width={170} height={170} className="absolute -right-4 -bottom-5 opacity-0 transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" /></button>)}</div><p className="text-center text-sm text-muted-foreground">Already have an account? <a className="font-medium text-primary hover:underline" href="/login">Log in</a></p></div>;
}
