import Link from "next/link";

import { Button } from "@/components/ui/button";

import { publicHomeCopy, publicHomeLinks } from "./public-home-content";

export function PublicHomeHero() {
  return (
    <section
      aria-labelledby="public-home-heading"
      className="relative isolate min-h-[calc(100svh-4.5rem)] overflow-hidden"
    >
      <video
        className="absolute inset-0 z-0 size-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/vd/homepage.mp4" type="video/mp4" />
      </video>
      {/* <div className="absolute inset-0 z-1 bg-gradient-to-r from-background/85 via-background/45 to-background/5" aria-hidden="true" /> */}
      <div className="absolute inset-0 z-1 bg-secondary/10" aria-hidden="true" />

      <div className="flex min-h-[calc(100svh-4.5rem)] items-center px-6 pb-28 pt-12 sm:px-10 sm:pb-32 sm:pt-14 lg:px-14 lg:pb-36 lg:pt-20">
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            {publicHomeCopy.eyebrow}
          </p>
          <h1
            id="public-home-heading"
            className="mt-5 max-w-[12ch] font-heading text-5xl font-semibold leading-[0.98] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            {publicHomeCopy.headline}
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
            {publicHomeCopy.description}
          </p>
        </div>
        <p className="sr-only">{publicHomeCopy.videoLabel}</p>
      </div>

      <nav
        aria-label="Explore Gigmatch"
        className="absolute inset-x-4 bottom-5 z-20 flex flex-wrap items-center justify-center gap-1 rounded-full border border-border/80 bg-background/90 p-1.5 shadow-md backdrop-blur-sm sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
      >
        {publicHomeLinks.map((link, index) => (
          <Button
            key={link.href}
            nativeButton={false}
            size="lg"
            variant={index === 0 ? "default" : "ghost"}
            className="min-h-11 flex-1 rounded-full px-4 sm:flex-none"
            render={<Link href={link.href}>{link.label}</Link>}
          />
        ))}
      </nav>
    </section>
  );
}
