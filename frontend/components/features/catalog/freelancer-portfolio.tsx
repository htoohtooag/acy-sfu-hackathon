import type { PackageGalleryItem, FreelancerProfilePresentation } from "@/features/catalog/mock-data";

import { PackageGallery } from "@/components/features/catalog/package-gallery";
import { PublicSampleWorkGallery } from "@/components/features/catalog/public-sample-work-gallery";
import type { FreelancerPublicSampleWork } from "shared/schemas";

interface FreelancerPortfolioProps {
  profile: FreelancerProfilePresentation;
  gallery: readonly PackageGalleryItem[];
  name: string;
  sampleWorks?: readonly FreelancerPublicSampleWork[];
}

export function FreelancerPortfolio({ profile, gallery, name, sampleWorks = [] }: FreelancerPortfolioProps) {
  return <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7" aria-labelledby="portfolio-heading"><h2 id="portfolio-heading" className="font-heading text-xl font-semibold text-foreground">Portfolio &amp; overview</h2>{sampleWorks.length > 0 ? <div className="mt-5"><PublicSampleWorkGallery items={sampleWorks} name={name} /></div> : gallery.length > 0 ? <div className="mt-5"><PackageGallery items={gallery} packageTitle={`${name} portfolio`} /></div> : null}<div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground"><p>{profile.about}</p><p><strong className="font-semibold text-foreground">Core expertise:</strong> {(profile.coreExpertise ?? profile.skills).join(", ")}.</p></div></section>;
}
