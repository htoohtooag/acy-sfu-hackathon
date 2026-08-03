import type { CatalogPackage } from "shared/schemas";

export type CatalogPackagePresentation = {
  categories: string[];
  languages: string[];
  skills: string[];
  englishLevel: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  revisions: string;
  visualTone: "primary" | "secondary" | "accent";
};

export type PackageGalleryItem = {
  id: string;
  imageUrl: string;
  alt: string;
};

export type PackageTierPresentation = {
  id: string;
  name: string;
  priceMmk: string;
  summary: string;
  deliveryDays: number;
  revisions: string;
  features: readonly string[];
  popular?: boolean;
};

export type CatalogPackageDetailPresentation = CatalogPackagePresentation & {
  role: string;
  publishedOn: string;
  skillsAndDeliverables: readonly string[];
  gallery: readonly PackageGalleryItem[];
  tiers: readonly PackageTierPresentation[];
  relatedPackageIds: readonly string[];
};

export type FreelancerProfilePresentation = {
  freelancerId: string;
  about: string;
  skills: readonly string[];
  successRate: number;
  completedCount: number;
  ratingLabel: string;
  rating: number;
  reviewCount: number;
  profileImageUrl?: string;
  otherPackageIds: readonly string[];
  bannerImageUrl?: string;
  portfolioGallery?: readonly PackageGalleryItem[];
  localTime?: string;
  responseTime?: string;
  languages?: readonly ProfileLanguage[];
  coreExpertise?: readonly string[];
  workHistory?: readonly ProfileWorkHistory[];
};

export type ProfileLanguage = { name: string; fluency: string };

export type ProfileWorkHistory = {
  id: string;
  title: string;
  rating: number;
  contractType: string;
  rate: string;
  dates: string;
  review: string;
  skills: readonly string[];
  status: "completed" | "in-progress";
};

export const mockCatalogPackages: CatalogPackage[] = [
  {
    id: "catalog-package-1",
    freelancer_id: "freelancer-1",
    tier_id: "tier-pro",
    title: "I will design a conversion focused product experience",
    description: "A thoughtful web or app interface with a clear visual system, responsive states, and a handoff your team can use.",
    price_mmk: "150000",
    delivery_days: 3,
    features: ["Responsive UI", "Design system", "Figma handoff"],
    is_active: true,
    created_at: "2026-07-22T08:00:00.000Z",
    updated_at: "2026-07-22T08:00:00.000Z",
    freelancer: {
      id: "freelancer-1",
      user_id: "user-1",
      headline: "Product designer for ambitious teams",
      location_city: "Yangon",
      is_verified: true,
      user: { id: "user-1", full_name: "Aung Kyaw P.", avatar_url: null },
    },
    tier: { id: "tier-pro", name: "PRO", display_name: "Pro" },
  },
  {
    id: "catalog-package-2",
    freelancer_id: "freelancer-2",
    tier_id: "tier-premium",
    title: "I will build a polished dashboard for your growing product",
    description: "Turn complex workflows into an intuitive dashboard with reusable components and a clean responsive layout.",
    price_mmk: "280000",
    delivery_days: 5,
    features: ["Dashboard UX", "Component library", "Prototype"],
    is_active: true,
    created_at: "2026-07-18T08:00:00.000Z",
    updated_at: "2026-07-18T08:00:00.000Z",
    freelancer: {
      id: "freelancer-2",
      user_id: "user-2",
      headline: "Interface designer and design systems partner",
      location_city: "Mandalay",
      is_verified: true,
      user: { id: "user-2", full_name: "Su Su Hlaing", avatar_url: null },
    },
    tier: { id: "tier-premium", name: "PREMIUM", display_name: "Premium" },
  },
  {
    id: "catalog-package-3",
    freelancer_id: "freelancer-3",
    tier_id: null,
    title: "I will automate your team workflow with no code tools",
    description: "Connect the tools your team already uses and remove repetitive work with a dependable automation plan.",
    price_mmk: "95000",
    delivery_days: 2,
    features: ["Workflow audit", "Zapier setup", "Documentation"],
    is_active: true,
    created_at: "2026-07-15T08:00:00.000Z",
    updated_at: "2026-07-15T08:00:00.000Z",
    freelancer: {
      id: "freelancer-3",
      user_id: "user-3",
      headline: "Automation specialist for small teams",
      location_city: "Yangon",
      is_verified: false,
      user: { id: "user-3", full_name: "Min Thura", avatar_url: null },
    },
    tier: null,
  },
  {
    id: "catalog-package-4",
    freelancer_id: "freelancer-4",
    tier_id: "tier-pro",
    title: "I will create a launch ready brand identity",
    description: "A focused identity direction with practical brand assets for your website, social channels, and launch materials.",
    price_mmk: "210000",
    delivery_days: 7,
    features: ["Logo direction", "Color system", "Brand guide"],
    is_active: true,
    created_at: "2026-07-10T08:00:00.000Z",
    updated_at: "2026-07-10T08:00:00.000Z",
    freelancer: {
      id: "freelancer-4",
      user_id: "user-4",
      headline: "Brand designer with a practical point of view",
      location_city: "Naypyidaw",
      is_verified: true,
      user: { id: "user-4", full_name: "Ei Mon Zaw", avatar_url: null },
    },
    tier: { id: "tier-pro", name: "PRO", display_name: "Pro" },
  },
  {
    id: "catalog-package-5",
    freelancer_id: "freelancer-5",
    tier_id: null,
    title: "I will write clear content that sounds like your company",
    description: "Website and product copy that makes your value easy to understand and gives every page a confident voice.",
    price_mmk: "80000",
    delivery_days: 4,
    features: ["Website copy", "Tone of voice", "Two revisions"],
    is_active: true,
    created_at: "2026-07-05T08:00:00.000Z",
    updated_at: "2026-07-05T08:00:00.000Z",
    freelancer: {
      id: "freelancer-5",
      user_id: "user-5",
      headline: "Content writer for useful digital products",
      location_city: "Yangon",
      is_verified: false,
      user: { id: "user-5", full_name: "Nyein Chan", avatar_url: null },
    },
    tier: null,
  },
  {
    id: "catalog-package-6",
    freelancer_id: "freelancer-6",
    tier_id: "tier-premium",
    title: "I will develop a fast and accessible Next.js website",
    description: "A production minded marketing site with responsive implementation, accessible interactions, and a maintainable structure.",
    price_mmk: "360000",
    delivery_days: 10,
    features: ["Next.js build", "Responsive frontend", "SEO setup"],
    is_active: true,
    created_at: "2026-06-28T08:00:00.000Z",
    updated_at: "2026-06-28T08:00:00.000Z",
    freelancer: {
      id: "freelancer-6",
      user_id: "user-6",
      headline: "Frontend engineer for thoughtful products",
      location_city: "Mawlamyine",
      is_verified: true,
      user: { id: "user-6", full_name: "Ko Lin Htet", avatar_url: null },
    },
    tier: { id: "tier-premium", name: "PREMIUM", display_name: "Premium" },
  },
];

export const catalogPackagePresentation: Record<string, CatalogPackagePresentation> = {
  "catalog-package-1": { categories: ["design", "creative"], languages: ["English", "Burmese"], skills: ["Figma", "Product design"], englishLevel: "Fluent", imageUrl: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=900&q=80", rating: 4.9, reviewCount: 128, revisions: "2 revisions", visualTone: "primary" },
  "catalog-package-2": { categories: ["design", "development"], languages: ["English", "Burmese"], skills: ["Figma", "UX research"], englishLevel: "Fluent", imageUrl: "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=900&q=80", rating: 5, reviewCount: 84, revisions: "Unlimited revisions", visualTone: "secondary" },
  "catalog-package-3": { categories: ["automation", "ai-automation"], languages: ["English", "Burmese"], skills: ["Zapier", "Make"], englishLevel: "Conversational", imageUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=900&q=80", rating: 4.8, reviewCount: 42, revisions: "2 revisions", visualTone: "accent" },
  "catalog-package-4": { categories: ["design", "branding"], languages: ["English", "Burmese"], skills: ["Branding", "Illustrator"], englishLevel: "Fluent", imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=80", rating: 4.9, reviewCount: 67, revisions: "3 revisions", visualTone: "primary" },
  "catalog-package-5": { categories: ["writing", "content-writing"], languages: ["English", "Burmese"], skills: ["Copywriting", "SEO writing"], englishLevel: "Fluent", imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80", rating: 4.7, reviewCount: 31, revisions: "2 revisions", visualTone: "secondary" },
  "catalog-package-6": { categories: ["development", "web-development"], languages: ["English", "Burmese"], skills: ["Next.js", "TypeScript"], englishLevel: "Fluent", imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80", rating: 4.9, reviewCount: 56, revisions: "2 revisions", visualTone: "accent" },
};

const packageGalleryImages = {
  designPrimary: [
    { id: "design-primary-1", imageUrl: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1400&q=82", alt: "Product interface screens arranged in a visual design presentation" },
    { id: "design-primary-2", imageUrl: "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1400&q=82", alt: "Responsive application interface shown across multiple screens" },
    { id: "design-primary-3", imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=82", alt: "Developer workspace with a product interface on screen" },
  ],
  dashboard: [
    { id: "dashboard-1", imageUrl: "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1400&q=82", alt: "Dashboard interface with organized product metrics" },
    { id: "dashboard-2", imageUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=82", alt: "Team collaboration workspace for a digital product" },
    { id: "dashboard-3", imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=82", alt: "Frontend development workspace for a dashboard project" },
  ],
  brand: [
    { id: "brand-1", imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1400&q=82", alt: "Brand identity materials arranged on a desk" },
    { id: "brand-2", imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=82", alt: "Creative work table with brand planning materials" },
    { id: "brand-3", imageUrl: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1400&q=82", alt: "Digital brand system shown in a design presentation" },
  ],
} as const;

const tierSets = {
  design: [
    { id: "design-basic", name: "Basic", priceMmk: "150000", summary: "Up to 3 core screens for an MVP or focused proof of concept.", deliveryDays: 3, revisions: "1 revision", features: ["Responsive direction", "Figma source"] },
    { id: "design-standard", name: "Standard", priceMmk: "250000", summary: "Up to 8 screens, a full prototype, and a practical design system.", deliveryDays: 7, revisions: "3 revisions", features: ["User flow mapping", "Light and dark mode"], popular: true },
    { id: "design-premium", name: "Premium", priceMmk: "400000", summary: "A complete product experience with polished states and handoff support.", deliveryDays: 12, revisions: "5 revisions", features: ["Advanced interaction states", "Developer handoff"] },
  ],
  dashboard: [
    { id: "dashboard-basic", name: "Basic", priceMmk: "280000", summary: "A focused dashboard flow with the key screens your team needs first.", deliveryDays: 5, revisions: "2 revisions", features: ["Dashboard UX", "Responsive layout"] },
    { id: "dashboard-standard", name: "Standard", priceMmk: "420000", summary: "A reusable dashboard system for complex workflows and growing teams.", deliveryDays: 9, revisions: "3 revisions", features: ["Component library", "Prototype walkthrough"], popular: true },
    { id: "dashboard-premium", name: "Premium", priceMmk: "650000", summary: "A complete product operations surface with polished states and documentation.", deliveryDays: 14, revisions: "5 revisions", features: ["Advanced data states", "Design system handoff"] },
  ],
  brand: [
    { id: "brand-basic", name: "Basic", priceMmk: "210000", summary: "A clear identity direction with the essential launch assets.", deliveryDays: 7, revisions: "2 revisions", features: ["Logo direction", "Color system"] },
    { id: "brand-standard", name: "Standard", priceMmk: "340000", summary: "A complete brand foundation ready for web, social, and launch materials.", deliveryDays: 10, revisions: "3 revisions", features: ["Brand guide", "Social templates"], popular: true },
    { id: "brand-premium", name: "Premium", priceMmk: "520000", summary: "A distinctive brand system with detailed usage guidance for your team.", deliveryDays: 15, revisions: "5 revisions", features: ["Campaign direction", "Full asset library"] },
  ],
} as const;

export const catalogPackageDetailPresentation: Record<string, CatalogPackageDetailPresentation> = {
  "catalog-package-1": { ...catalogPackagePresentation["catalog-package-1"], role: "Product designer", publishedOn: "2026-07-22", skillsAndDeliverables: ["Figma", "Product design", "Responsive UI", "Design system"], gallery: [...packageGalleryImages.designPrimary], tiers: [...tierSets.design], relatedPackageIds: ["catalog-package-2", "catalog-package-4"] },
  "catalog-package-2": { ...catalogPackagePresentation["catalog-package-2"], role: "Interface designer", publishedOn: "2026-07-18", skillsAndDeliverables: ["Figma", "UX research", "Dashboard UX", "Component library"], gallery: [...packageGalleryImages.dashboard], tiers: [...tierSets.dashboard], relatedPackageIds: ["catalog-package-1"] },
  "catalog-package-3": { ...catalogPackagePresentation["catalog-package-3"], role: "Automation specialist", publishedOn: "2026-07-15", skillsAndDeliverables: ["Zapier", "Make", "Workflow audit", "Documentation"], gallery: [...packageGalleryImages.dashboard], tiers: [...tierSets.dashboard], relatedPackageIds: ["catalog-package-6"] },
  "catalog-package-4": { ...catalogPackagePresentation["catalog-package-4"], role: "Brand designer", publishedOn: "2026-07-10", skillsAndDeliverables: ["Branding", "Illustrator", "Logo direction", "Brand guide"], gallery: [...packageGalleryImages.brand], tiers: [...tierSets.brand], relatedPackageIds: ["catalog-package-1", "catalog-package-5"] },
  "catalog-package-5": { ...catalogPackagePresentation["catalog-package-5"], role: "Content writer", publishedOn: "2026-07-05", skillsAndDeliverables: ["Copywriting", "SEO writing", "Website copy", "Tone of voice"], gallery: [...packageGalleryImages.brand], tiers: [...tierSets.brand], relatedPackageIds: ["catalog-package-4"] },
  "catalog-package-6": { ...catalogPackagePresentation["catalog-package-6"], role: "Frontend engineer", publishedOn: "2026-06-28", skillsAndDeliverables: ["Next.js", "TypeScript", "Responsive frontend", "SEO setup"], gallery: [...packageGalleryImages.dashboard], tiers: [...tierSets.dashboard], relatedPackageIds: ["catalog-package-3", "catalog-package-2"] },
};

export const freelancerProfilePresentation: Record<string, FreelancerProfilePresentation> = {
  "freelancer-1": { freelancerId: "freelancer-1", about: "I am a senior product designer with over 5 years of experience building high performance digital products. My passion lies in crafting pixel precise, fluid user interfaces that deliver excellent user experiences. I specialize in complex state management, custom animations, and robust backend integrations for thoughtful teams.", skills: ["Figma", "Product strategy", "Design systems", "Prototyping"], successRate: 98, completedCount: 45, ratingLabel: "Top rated plus", rating: 4.9, reviewCount: 128, otherPackageIds: ["catalog-package-2", "catalog-package-4"], profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=82", bannerImageUrl: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1800&q=82", portfolioGallery: catalogPackageDetailPresentation["catalog-package-1"].gallery, localTime: "8:45 pm local time", responseTime: "< 2hrs", languages: [{ name: "Burmese", fluency: "Native" }, { name: "English", fluency: "Fluent" }], coreExpertise: ["Flutter", "Dart", "UI/UX Implementation", "State Management", "API Integration", "App Store Deployment"], workHistory: [{ id: "history-1", title: "Fintech Mobile App UI Revamp", rating: 5, contractType: "Fixed price", rate: "$1,200.00", dates: "Oct 15, 2023 - Nov 10, 2023", review: "Zin delivered exceptional work on our app's UI. The animations are buttery smooth and the code quality is top notch. Highly recommended for complex Flutter tasks.", skills: ["Flutter", "Riverpod", "UI/UX Design"], status: "completed" }, { id: "history-2", title: "E-commerce App Integration", rating: 4.9, contractType: "Hourly", rate: "$25.00 /hr", dates: "Aug 2, 2023 - Sep 1, 2023", review: "Integrated custom payment gateways and complex product variants filtering system. Great communication throughout.", skills: ["Dart", "Firebase", "API Integration"], status: "completed" }, { id: "history-3", title: "Healthcare Dashboard Prototype", rating: 0, contractType: "Fixed price", rate: "$800.00", dates: "In progress", review: "A clear dashboard prototype for a growing healthcare product team.", skills: ["Flutter", "Figma"], status: "in-progress" }] },
  "freelancer-2": { freelancerId: "freelancer-2", about: "I make complex product workflows easier to understand and easier to use. I partner closely with product and engineering teams to build scalable interface systems that remain calm as the product grows.", skills: ["Figma", "UX research", "Dashboard UX", "Design systems"], successRate: 97, completedCount: 38, ratingLabel: "Top rated", rating: 5, reviewCount: 84, otherPackageIds: ["catalog-package-1"] },
  "freelancer-3": { freelancerId: "freelancer-3", about: "I remove repetitive work from small teams by connecting the tools they already trust. Every automation includes a clear handoff and documentation so your team can own it with confidence.", skills: ["Zapier", "Make", "Process design", "Documentation"], successRate: 96, completedCount: 29, ratingLabel: "Rising talent", rating: 4.8, reviewCount: 42, otherPackageIds: ["catalog-package-6"] },
  "freelancer-4": { freelancerId: "freelancer-4", about: "I build practical identities for teams that want to look distinct and stay consistent. The work balances a strong point of view with systems your team can actually use every day.", skills: ["Branding", "Illustrator", "Art direction", "Brand systems"], successRate: 99, completedCount: 51, ratingLabel: "Top rated", rating: 4.9, reviewCount: 67, otherPackageIds: ["catalog-package-1", "catalog-package-5"] },
  "freelancer-5": { freelancerId: "freelancer-5", about: "I write useful copy that gives digital products a confident, human voice. I focus on clarity, voice, and the small details that help readers know what to do next.", skills: ["Copywriting", "SEO writing", "Content strategy", "Editing"], successRate: 95, completedCount: 24, ratingLabel: "Rising talent", rating: 4.7, reviewCount: 31, otherPackageIds: ["catalog-package-4"] },
  "freelancer-6": { freelancerId: "freelancer-6", about: "I build fast, accessible interfaces for thoughtful products. My work is production minded, with an emphasis on maintainable structure, responsive behavior, and a strong handoff between design and engineering.", skills: ["Next.js", "TypeScript", "Accessibility", "Frontend architecture"], successRate: 98, completedCount: 42, ratingLabel: "Top rated", rating: 4.9, reviewCount: 56, otherPackageIds: ["catalog-package-2", "catalog-package-3"] },
};

export function findMockCatalogPackage(id: string): CatalogPackage | undefined {
  return mockCatalogPackages.find((item) => item.id === id && item.is_active);
}

export function findCatalogPackageDetailPresentation(id: string): CatalogPackageDetailPresentation | undefined {
  return catalogPackageDetailPresentation[id];
}

export function findFreelancerProfilePresentation(id: string): FreelancerProfilePresentation | undefined {
  return freelancerProfilePresentation[id];
}

export function getFreelancerPackages(freelancerId: string): CatalogPackage[] {
  return mockCatalogPackages.filter((item) => item.freelancer_id === freelancerId && item.is_active);
}
