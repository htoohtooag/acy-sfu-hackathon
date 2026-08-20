"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

const visuals: Record<string, { src: string; alt: string; title: string }> = {
  "/login": { src: "/auth/logins1.svg", alt: "A person finding trusted freelance talent", title: "Work that feels made for you." },
  "/signup": { src: "/auth/signups1_choice.svg", alt: "A friendly choice between hiring and freelancing", title: "Choose the way you want to work." },
  "/signup/account": { src: "/auth/signups2.svg", alt: "A person beginning a Gigmatch account", title: "Your next opportunity starts here." },
  "/onboarding": { src: "/auth/obs3.svg", alt: "A person completing a profile", title: "A little context helps the right people find you." },
};

export function AuthVisualPanel() {
  const pathname = usePathname();
  const visual = pathname.startsWith("/onboarding") ? visuals["/onboarding"] : visuals[pathname] ?? visuals["/login"];

  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-backgound lg:block">
      <Image src={visual.src} alt={visual.alt} fill priority className="object-contain object-center" sizes="45vw" />
      <div className="absolute inset-0 bg-primary/20" />
      <div className="absolute inset-x-0 bottom-0 z-10 p-12 text-primary-foreground xl:p-16">
        <p className="font-display text-4xl leading-none xl:text-6xl">Gigmatch</p>
        <p className="mt-5 max-w-sm text-lg text-primary-foreground/80">{visual.title}</p>
      </div>
    </aside>
  );
}
