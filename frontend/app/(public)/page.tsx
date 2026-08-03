import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function PublicHomePage() {
  return (
    <main id="main-content" className="flex-1 overflow-hidden">
      <section className="relative isolate border-b border-border">
        <div className="absolute inset-0 -z-10 bg-primary/5 opacity-60" />
        <div className="mx-auto grid max-w-7xl gap-16 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
          <div className="flex max-w-3xl flex-col items-start gap-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
              <Sparkles aria-hidden="true" className="size-4" />
              Better work starts with the right match
            </div>
            <h1 className="max-w-3xl font-heading text-5xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Find the people who make good ideas happen.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              TalentScout brings ambitious teams and trusted independent talent together for work that moves forward.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button nativeButton={false} size="lg" render={<Link href="/freelancers">Explore talent <ArrowRight aria-hidden="true" /></Link>} />
              <Button nativeButton={false} size="lg" variant="outline" render={<Link href="/jobs">Find your next project</Link>} />
            </div>
          </div>
          <div className="menu-pattern relative min-h-80 overflow-hidden rounded-4xl border border-foreground/15 bg-foreground p-6 text-background shadow-2xl sm:min-h-96">
            <div className="flex h-full flex-col justify-between gap-12">
              <div className="flex items-center justify-between text-background/60">
                <span className="text-sm uppercase tracking-[0.2em]">TalentScout / 01</span>
                <Sparkles aria-hidden="true" className="size-5" />
              </div>
              <div className="max-w-sm">
                <p className="font-heading text-3xl leading-tight sm:text-4xl">A calmer way to get great work done.</p>
                <div className="mt-7 flex items-center gap-3 text-sm text-background/70">
                  <CheckCircle2 aria-hidden="true" className="size-5 text-background" />
                  Curated talent, clear expectations, meaningful outcomes.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        {[
          ["01", "Discover confidently", "Browse skilled people with the context you need to choose well."],
          ["02", "Work with clarity", "Start every project with shared expectations and a simple path forward."],
          ["03", "Grow together", "Build relationships that make the next project even better."],
        ].map(([number, title, description]) => (
          <article key={number} className="rounded-2xl border border-border bg-card p-6">
            <p className="text-sm font-semibold text-primary">{number}</p>
            <h2 className="mt-12 font-heading text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
