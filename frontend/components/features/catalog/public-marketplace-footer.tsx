import Link from "next/link";

const footerGroups = [
  { label: "Explore", links: [{ label: "Find talent", href: "/freelancers" }, { label: "Find work", href: "/freelancers" }] },
  { label: "Categories", links: [{ label: "Development & IT", href: "/freelancers?category=development" }, { label: "Design & creative", href: "/freelancers?category=design" }] },
  { label: "Company", links: [{ label: "About us", href: "/" }, { label: "Success stories", href: "/" }] },
  { label: "Support", links: [{ label: "Privacy policy", href: "/" }, { label: "Help center", href: "/" }] },
] as const;

export function PublicMarketplaceFooter() {
  return <footer className="border-t border-border bg-background"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.3fr_repeat(4,1fr)] lg:px-8"><div><Link href="/" className="font-heading text-xl font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Gigmatch</Link><p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">Myanmar&apos;s elite talent with global opportunities.</p><p className="mt-5 text-xs text-muted-foreground">© 2024 Gigmatch Marketplace</p></div>{footerGroups.map((group) => <nav key={group.label} aria-label={group.label}><h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">{group.label}</h2><ul className="mt-3 space-y-2">{group.links.map((link) => <li key={link.label}><Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">{link.label}</Link></li>)}</ul></nav>)}</div></footer>;
}
