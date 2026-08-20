import type { Metadata } from "next";

import { PublicHomeHero } from "@/components/features/public-home/public-home-hero";
import { PublicHomeSections } from "@/components/features/public-home/public-home-sections";

export const metadata: Metadata = {
  title: "Find talent. Build better. | Gigmatch",
  description: "Gigmatch is Myanmar's freelance marketplace for trusted talent and thoughtful teams.",
};

export default function PublicHomePage() {
  return (
    <main id="main-content" className="flex-1 overflow-hidden bg-background">
      <PublicHomeHero />
      <PublicHomeSections />
    </main>
  );
}
