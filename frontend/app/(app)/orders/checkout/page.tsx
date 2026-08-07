import { notFound } from "next/navigation";
import { z } from "zod";

import { CheckoutPage } from "@/components/features/checkout/checkout-page";
import { getCatalogPackage } from "@/features/catalog/catalog-api";

type CheckoutRouteProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CheckoutRoute({ searchParams }: CheckoutRouteProps) {
  const packageIdParam = (await searchParams).packageId;
  const packageId = typeof packageIdParam === "string" && z.uuid().safeParse(packageIdParam).success ? packageIdParam : null;
  if (!packageId) notFound();

  const packageItem = await getCatalogPackage(packageId).catch(() => null);
  if (!packageItem) notFound();

  return <main id="main-content" className="flex-1 bg-muted/20 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16"><CheckoutPage packageItem={packageItem} /></main>;
}
