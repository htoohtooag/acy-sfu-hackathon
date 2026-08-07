import type { CatalogPackage } from "shared/schemas";
import type { CheckoutQuote } from "@/features/checkout/checkout-types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CheckoutSummaryProps {
  packageItem: CatalogPackage;
  quote: CheckoutQuote | undefined;
  loading: boolean;
}

function formatMmk(value: string): string {
  return `${new Intl.NumberFormat("en-US").format(Number(value))} MMK`;
}

export function CheckoutSummary({ packageItem, quote, loading }: CheckoutSummaryProps) {
  const price = quote?.agreed_price_mmk ?? packageItem.price_mmk;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order summary</CardTitle>
        <CardDescription>Review the contract amount before sending payment proof.</CardDescription>
      </CardHeader>
      <CardContent className="gap-5">
        <div className="flex flex-col gap-1">
          <p className="font-heading text-lg font-semibold text-foreground">{packageItem.title}</p>
          <p className="text-sm text-muted-foreground">{packageItem.freelancer.user.full_name ?? "TalentScout freelancer"}</p>
        </div>
        <dl className="flex flex-col gap-3 border-y border-border py-4 text-sm">
          <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Package price</dt><dd className="font-medium text-foreground">{formatMmk(price)}</dd></div>
          <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Platform fee</dt><dd className="font-medium text-foreground">{loading ? "Calculating…" : quote ? formatMmk(quote.platform_fee_mmk) : "Unavailable"}</dd></div>
          <div className="flex items-center justify-between gap-4 text-base"><dt className="font-semibold text-foreground">Amount to transfer</dt><dd className="font-heading font-semibold text-primary">{formatMmk(price)}</dd></div>
        </dl>
        <p className="text-xs leading-5 text-muted-foreground">The platform fee is disclosed separately and locked when the order is created. The payment proof amount must equal the package price.</p>
      </CardContent>
    </Card>
  );
}
