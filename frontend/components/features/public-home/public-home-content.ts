import type { Route } from "next";

export type PublicHomeLink = {
  label: string;
  href: Route;
};

export type PublicHomeSection = {
  eyebrow: string;
  title: string;
  description: string;
};

export type PublicHomeAudience = PublicHomeSection & {
  label: string;
  href: Route;
};

export type PublicHomeBenefit = {
  number: string;
  title: string;
  description: string;
};

export type PublicHomeProcessStep = {
  number: string;
  title: string;
  description: string;
};

export type PublicHomeExample = {
  label: string;
  title: string;
  description: string;
  href: Route;
  actionLabel: string;
};

export type PublicHomeFaq = {
  question: string;
  answer: string;
};

export type PublicFooterGroup = {
  title: string;
  links: PublicHomeLink[];
};

export const publicHomeCopy = {
  eyebrow: "Gigmatch marketplace",
  headline: "Find talent. Build better.",
  description:
    "Connect with trusted Myanmar talent and thoughtful teams for work that moves forward.",
  videoLabel: "Gigmatch marketplace in motion",
};

export const publicHomeLinks: PublicHomeLink[] = [
  { label: "Explore talent", href: "/freelancers" },
  { label: "Explore work", href: "/jobs" },
  { label: "Join us", href: "/signup" },
];

export const publicHomeTrust: PublicHomeSection = {
  eyebrow: "A better way to get work moving",
  title: "Good work starts with the right match.",
  description:
    "Gigmatch gives clients and freelancers a clear path from first idea to finished work, with the context and confidence to move forward together.",
};

export const publicHomeAudiences: PublicHomeAudience[] = [
  {
    label: "For clients",
    eyebrow: "Find the right fit",
    title: "Bring your next project to life.",
    description:
      "Browse thoughtful services from Myanmar talent and choose a package that gives your project a clear starting point.",
    href: "/freelancers",
  },
  {
    label: "For freelancers",
    eyebrow: "Share what you do best",
    title: "Turn your skills into meaningful work.",
    description:
      "Show clients how you can help, set clear expectations, and build a portfolio of work you are proud to share.",
    href: "/jobs",
  },
];

export const publicHomeBenefits: PublicHomeBenefit[] = [
  {
    number: "01",
    title: "Clear packages",
    description: "Know what is included, what it costs, and when to expect the work before you begin.",
  },
  {
    number: "02",
    title: "Protected payments",
    description: "Keep payment steps visible and agreed while the work moves from brief to delivery.",
  },
  {
    number: "03",
    title: "Direct collaboration",
    description: "Keep the conversation close to the work so decisions stay easy to follow.",
  },
];

export const publicHomeProcess: PublicHomeProcessStep[] = [
  { number: "01", title: "Discover", description: "Explore services or projects that fit your goals." },
  { number: "02", title: "Agree", description: "Align on the scope, timing, and payment before work starts." },
  { number: "03", title: "Create", description: "Work together with a shared understanding of what comes next." },
  { number: "04", title: "Complete", description: "Review the finished work and close the project with confidence." },
];

export const publicHomeExamples: PublicHomeExample[] = [
  {
    label: "Talent example",
    title: "A focused creative partner for your next launch.",
    description: "Find specialists who bring a clear point of view, practical process, and care to every brief.",
    href: "/freelancers",
    actionLabel: "Find talent",
  },
  {
    label: "Work example",
    title: "A meaningful project that needs your perspective.",
    description: "Explore opportunities where your skills can make a visible difference for a growing team.",
    href: "/jobs",
    actionLabel: "Find work",
  },
];

export const publicHomeFaqs: PublicHomeFaq[] = [
  {
    question: "How do I hire talent?",
    answer: "Start by browsing the talent catalogue. Open a service that fits your needs, review its package details, and follow the existing checkout path when you are ready.",
  },
  {
    question: "How do I find work?",
    answer: "Visit Find work to explore public project opportunities. When you find a project that fits your skills, sign up or log in to continue.",
  },
  {
    question: "How do payments work?",
    answer: "Payment expectations are made clear before work begins. Gigmatch keeps the payment step visible while the project moves toward delivery.",
  },
  {
    question: "How do I create a profile?",
    answer: "Choose Join to create an account, then follow the onboarding steps for your role. You can add the details that help clients or freelancers understand how you work.",
  },
];

export const publicHomeCta: PublicHomeSection & { primary: PublicHomeLink; secondary: PublicHomeLink } = {
  eyebrow: "Ready when you are",
  title: "Find your next good match.",
  description: "Start with a catalogue, a project, or a simple introduction to Gigmatch.",
  primary: { label: "Find talent", href: "/freelancers" },
  secondary: { label: "Find work", href: "/jobs" },
};

export const publicFooterGroups: PublicFooterGroup[] = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Find talent", href: "/freelancers" },
      { label: "Find work", href: "/jobs" },
    ],
  },
  {
    title: "Join Gigmatch",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Join", href: "/signup" },
    ],
  },
];
