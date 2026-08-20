"use client";

import Link from "next/link";
import { Menu, Search, X } from "lucide-react";

import { mobileNavigationGroups, publicLinks } from "@/constants/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNavbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open navigation"><Menu aria-hidden="true" /></Button>} />
        <SheetContent>
          <SheetHeader>
            <div className="flex items-center justify-between gap-4">
              <SheetTitle className="font-heading text-xl tracking-tight text-primary">Gigmatch</SheetTitle>
              <SheetClose render={<Button variant="ghost" size="icon" aria-label="Close navigation"><X aria-hidden="true" /></Button>} />
            </div>
            <SheetDescription>Find trusted people and meaningful work in one place.</SheetDescription>
          </SheetHeader>
          <form action="/freelancers" className="flex min-h-11 items-center gap-3 rounded-xl border border-input bg-muted/40 px-3 text-sm text-muted-foreground focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
            <Search aria-hidden="true" className="size-4 shrink-0" />
            <span className="sr-only">Search services</span>
            <input id="mobile-service-search" name="search" type="search" placeholder="Search services" className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground" />
          </form>
          <nav aria-label="Mobile primary" className="flex flex-col">
            <Accordion className="w-full" defaultValue={["talent"]}>
              {mobileNavigationGroups.map((group) => (
                <AccordionItem key={group.key} value={group.key}>
                  <AccordionTrigger>{group.label}</AccordionTrigger>
                  <AccordionContent>
                    {"categories" in group ? (
                      <div className="space-y-4">
                        {group.categories.map((category) => (
                          <div key={category.key}>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{category.label}</p>
                            <ul className="space-y-1">
                              {category.items.map((item) => (
                                <li key={item.key}>
                                  <SheetClose render={<Link href={item.href} className="flex min-h-11 items-center rounded-lg px-2 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">{item.label}</Link>} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="space-y-1">
                        {group.items.map((item) => (
                          <li key={item.key}>
                            <SheetClose render={<Link href={item.href} className="flex min-h-11 flex-col justify-center rounded-lg px-2 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><span className="text-sm font-medium text-foreground">{item.label}</span><span className="text-sm text-muted-foreground">{item.description}</span></Link>} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <ul className="mt-2 border-t border-border pt-2">
              {publicLinks.map((link) => (
                <li key={link.key}>
                  <SheetClose render={<Link href={link.href} className="flex min-h-12 items-center rounded-lg px-2 text-base font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">{link.label}</Link>} />
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
            {isAuthenticated ? <SheetClose render={<Button nativeButton={false} render={<Link href="/dashboard">Go to Dashboard</Link>} />} /> : <><SheetClose render={<Button nativeButton={false} variant="outline" render={<Link href="/login">Log in</Link>} />} /><SheetClose render={<Button nativeButton={false} render={<Link href="/signup">Join now</Link>} />} /></>}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
