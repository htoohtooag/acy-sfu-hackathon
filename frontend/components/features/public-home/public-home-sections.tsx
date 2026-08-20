import Link from "next/link";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  publicHomeAudiences,
  publicHomeBenefits,
  publicHomeCta,
  publicHomeExamples,
  publicHomeFaqs,
  publicHomeProcess,
  publicHomeTrust,
} from "./public-home-content";

function SectionHeading({ id, section }: { id: string; section: { eyebrow: string; title: string; description: string } }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{section.eyebrow}</p>
      <h2 id={id} className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{section.title}</h2>
      <p className="mt-4 text-base leading-7 text-muted-foreground">{section.description}</p>
    </div>
  );
}

export function PublicHomeSections() {
  return (
    <div className="overflow-hidden">
      <section aria-labelledby="public-home-trust-heading" className="bg-background px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
        <div className="mx-auto max-w-6xl">
          <SectionHeading id="public-home-trust-heading" section={publicHomeTrust} />
        </div>
      </section>

      <section aria-labelledby="public-home-audience-heading" className="bg-muted/30 px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            id="public-home-audience-heading"
            section={{
              eyebrow: "Choose your path",
              title: "One marketplace, two ways to move forward.",
              description: "Whether you are building a team or building your next chapter, start with the path that fits you.",
            }}
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {publicHomeAudiences.map((audience) => (
              <Card key={audience.label} className="min-w-0 border-border/80 bg-background shadow-none">
                <CardHeader>
                  <Badge className="w-fit">{audience.label}</Badge>
                  <CardTitle className="mt-3 text-2xl sm:text-3xl">{audience.title}</CardTitle>
                  <CardDescription className="max-w-lg text-base leading-7">{audience.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button nativeButton={false} render={<Link href={audience.href}>{audience.label}</Link>} />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="public-home-benefits-heading" className="bg-background px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            id="public-home-benefits-heading"
            section={{
              eyebrow: "Built for better work",
              title: "A simpler way to work together.",
              description: "Every part of the experience is designed to make the next step easier to understand.",
            }}
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {publicHomeBenefits.map((benefit) => (
              <Card key={benefit.number} className="min-w-0 border-border/80 shadow-none">
                <CardHeader>
                  <p className="text-sm font-semibold text-primary">{benefit.number}</p>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  <CardDescription className="text-base leading-7">{benefit.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="public-home-process-heading" className="bg-secondary px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            id="public-home-process-heading"
            section={{
              eyebrow: "From idea to done",
              title: "Keep the work moving, one clear step at a time.",
              description: "A shared process gives both sides room to focus on the work itself.",
            }}
          />
          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {publicHomeProcess.map((step) => (
              <div key={step.number} className="min-w-0">
                <p className="text-sm font-semibold text-primary">{step.number}</p>
                <Separator className="my-4 bg-secondary-foreground/20" />
                <h3 className="font-heading text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-secondary-foreground/75">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="public-home-examples-heading" className="bg-background px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            id="public-home-examples-heading"
            section={{
              eyebrow: "See what is possible",
              title: "A strong match can start anywhere.",
              description: "Explore the marketplace from the side of the table that brings your next step into focus.",
            }}
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {publicHomeExamples.map((example) => (
              <Card key={example.label} className="min-w-0 border-border/80 bg-muted/30 shadow-none">
                <CardHeader>
                  <Badge className="w-fit">{example.label}</Badge>
                  <CardTitle className="mt-3 text-2xl">{example.title}</CardTitle>
                  <CardDescription className="text-base leading-7">{example.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button nativeButton={false} variant="outline" render={<Link href={example.href}>{example.actionLabel}</Link>} />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="public-home-faq-heading" className="bg-muted/30 px-6 py-20 sm:px-10 sm:py-28 lg:px-14">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading
            id="public-home-faq-heading"
            section={{
              eyebrow: "Good questions",
              title: "Start with what you need to know.",
              description: "Here are a few answers to help you choose your next step with confidence.",
            }}
          />
          <Accordion className="min-w-0" defaultValue={["faq-0"]}>
            {publicHomeFaqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section aria-labelledby="public-home-cta-heading" className="bg-primary px-6 py-20 text-primary-foreground sm:px-10 sm:py-28 lg:px-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground/75">{publicHomeCta.eyebrow}</p>
            <h2 id="public-home-cta-heading" className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{publicHomeCta.title}</h2>
            <p className="mt-4 text-base leading-7 text-primary-foreground/80">{publicHomeCta.description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button nativeButton={false} variant="secondary" render={<Link href={publicHomeCta.primary.href}>{publicHomeCta.primary.label}</Link>} />
            <Button nativeButton={false} variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" render={<Link href={publicHomeCta.secondary.href}>{publicHomeCta.secondary.label}</Link>} />
          </div>
        </div>
      </section>
    </div>
  );
}
