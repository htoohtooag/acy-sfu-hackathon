import type { LucideIcon } from "lucide-react";
import {
  Bot,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Code2,
  FileText,
  HeartHandshake,
  Lightbulb,
  Megaphone,
  Palette,
  PenLine,
  Sparkles,
  Smartphone,
  Users,
} from "lucide-react";

export type NavigationItem = {
  key: string;
  label: string;
  description: string;
  href: string;
  icon?: LucideIcon;
};

export type NavigationCategory = {
  key: string;
  label: string;
  items: NavigationItem[];
};

export type NavigationCard = NavigationItem & {
  featured?: boolean;
};

export const publicLinks: NavigationItem[] = [
  {
    key: "enterprise",
    label: "Enterprise",
    description: "Build a flexible talent bench for your team.",
    href: "/enterprise",
    icon: BriefcaseBusiness,
  },
  {
    key: "pricing",
    label: "Pricing",
    description: "Simple plans for every stage of work.",
    href: "/pricing",
    icon: ChartNoAxesCombined,
  },
];

export const findTalentCategories: NavigationCategory[] = [
  {
    key: "ai-automation",
    label: "AI & Automation",
    items: [
      {
        key: "ai-builders",
        label: "AI Product Builders",
        description: "Turn an idea into a useful AI experience.",
        href: "/freelancers?category=ai-automation",
        icon: Bot,
      },
      {
        key: "automation-experts",
        label: "Automation Experts",
        description: "Connect the tools that keep work moving.",
        href: "/freelancers?category=automation",
        icon: Sparkles,
      },
      {
        key: "ai-consultants",
        label: "AI Consultants",
        description: "Make a confident plan for responsible AI adoption.",
        href: "/freelancers?category=consulting",
        icon: Lightbulb,
      },
    ],
  },
  {
    key: "development",
    label: "Development & IT",
    items: [
      {
        key: "web-developers",
        label: "Web Developers",
        description: "Ship fast, reliable websites and products.",
        href: "/freelancers?category=development",
        icon: Code2,
      },
      {
        key: "technical-partners",
        label: "Technical Partners",
        description: "Find hands on help for your next milestone.",
        href: "/freelancers?category=technical-partners",
        icon: Users,
      },
    ],
  },
  {
    key: "design",
    label: "Design & Creative",
    items: [
      {
        key: "brand-designers",
        label: "Brand Designers",
        description: "Create a visual identity people remember.",
        href: "/freelancers?category=design",
        icon: Palette,
      },
      {
        key: "content-creators",
        label: "Content Creators",
        description: "Bring your story to life across every channel.",
        href: "/freelancers?category=creative",
        icon: PenLine,
      },
    ],
  },
  {
    key: "marketing",
    label: "Marketing",
    items: [
      {
        key: "growth-marketers",
        label: "Growth Marketers",
        description: "Find the audience and message that fit.",
        href: "/freelancers?category=marketing",
        icon: Megaphone,
      },
    ],
  },
  {
    key: "analytics",
    label: "Data & Analytics",
    items: [
      {
        key: "data-analysts",
        label: "Data Analysts",
        description: "Turn messy information into clear decisions.",
        href: "/freelancers?category=data",
        icon: ChartNoAxesCombined,
      },
    ],
  },
  {
    key: "support",
    label: "Admin & Support",
    items: [
      {
        key: "operations-partners",
        label: "Operations Partners",
        description: "Make the day to day run more smoothly.",
        href: "/freelancers?category=admin-support",
        icon: HeartHandshake,
      },
    ],
  },
  {
    key: "writing",
    label: "Writing & Content",
    items: [
      {
        key: "copywriters",
        label: "Copywriters",
        description: "Give every important idea the right words.",
        href: "/freelancers?category=writing",
        icon: FileText,
      },
    ],
  },
];

export const findWorkCards: NavigationCard[] = [
  {
    key: "web-development",
    label: "Web Development",
    description: "Build fast, reliable websites and digital products.",
    href: "/freelancers?category=web-development",
    icon: Code2,
    featured: true,
  },
  {
    key: "mobile-apps",
    label: "Mobile Apps",
    description: "Create polished iOS and Android experiences.",
    href: "/freelancers?category=mobile-apps",
    icon: Smartphone,
    featured: true,
  },
  {
    key: "digital-marketing",
    label: "Digital Marketing",
    description: "Reach the right audience with a clear growth plan.",
    href: "/freelancers?category=digital-marketing",
    icon: Megaphone,
  },
  {
    key: "graphic-design",
    label: "Graphic Design",
    description: "Shape a visual identity people remember.",
    href: "/freelancers?category=graphic-design",
    icon: Palette,
  },
  {
    key: "content-writing",
    label: "Content Writing",
    description: "Give every important idea the right words.",
    href: "/freelancers?category=content-writing",
    icon: FileText,
  },
  {
    key: "data-analytics",
    label: "Data & Analytics",
    description: "Turn complex information into clear decisions.",
    href: "/freelancers?category=data-analytics",
    icon: ChartNoAxesCombined,
  },
];

export const mobileNavigationGroups = [
  {
    key: "talent",
    label: "Find Talent",
    categories: findTalentCategories,
  },
  {
    key: "work",
    label: "Find Work",
    items: findWorkCards,
  },
] as const;
