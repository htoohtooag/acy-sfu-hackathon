import Link from "next/link";

import { publicFooterGroups } from "./public-home-content";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-secondary px-6 py-12 sm:px-10 lg:px-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:justify-between">
        <div className="max-w-xs">
          <Link href="/" className="font-heading text-2xl font-bold tracking-tight text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            Gigmatch
          </Link>
          <p className="mt-4 text-sm leading-6 text-secondary-foreground/75">A clear path to trusted talent and meaningful work.</p>
        </div>
        <nav aria-label="Footer" className="grid gap-8 sm:grid-cols-2 sm:gap-16">
          {publicFooterGroups.map((group) => (
            <div key={group.title}>
              <p className="text-sm font-semibold text-foreground">{group.title}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="inline-flex min-h-9 items-center text-sm text-secondary-foreground/75 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
}
