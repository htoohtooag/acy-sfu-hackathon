"use client";

import Image from "next/image";
import type { PaymentMethodLookup } from "shared/schemas";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FieldDescription, FieldError, FieldLegend, FieldSet } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface PaymentMethodSelectorProps {
  methods: PaymentMethodLookup[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

function methodLabel(method: PaymentMethodLookup): string {
  return method.display_name ?? method.name.replaceAll("_", " ");
}

function methodInitials(method: PaymentMethodLookup): string {
  return methodLabel(method)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function supportedLogoUrl(logoUrl: string | null): string | null {
  if (logoUrl === null) return null;
  if (logoUrl.startsWith("/")) return logoUrl;

  try {
    const parsed = new URL(logoUrl);
    if (parsed.protocol === "https:" && parsed.hostname === "images.unsplash.com" && parsed.pathname.startsWith("/photo-")) return logoUrl;
  } catch {
    return null;
  }

  return null;
}

export function PaymentMethodSelector({ methods, value, onChange, disabled = false, error }: PaymentMethodSelectorProps) {
  const configuredMethods = methods.filter((method) => method.account_number !== null);
  const selectedMethod = methods.find((method) => method.id === value) ?? null;
  return (
    <FieldSet>
      <FieldLegend>Payment method</FieldLegend>
      <FieldDescription>Select the account you used for the transfer.</FieldDescription>
      {methods.length === 0 ? <Alert variant="destructive"><AlertTitle>No payment methods available</AlertTitle><AlertDescription>Checkout cannot continue until an active payment method is configured.</AlertDescription></Alert> : null}
      {methods.length > 0 && configuredMethods.length === 0 ? <Alert><AlertTitle>Payment details are being configured</AlertTitle><AlertDescription>Payment accounts are not available yet. Please try again later.</AlertDescription></Alert> : null}
      <RadioGroup value={value} onValueChange={onChange} aria-invalid={Boolean(error)} className="gap-3">
        {methods.map((method) => {
          const configured = method.account_number !== null;
          const selected = value === method.id;
          const logoUrl = supportedLogoUrl(method.logo_url);
          return (
            <label key={method.id} htmlFor={`payment-method-${method.id}`} className={cn("flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/50", selected && "border-primary bg-primary/5", (!configured || disabled) && "cursor-not-allowed opacity-60")}>
              <RadioGroupItem id={`payment-method-${method.id}`} value={method.id} disabled={disabled || !configured} aria-label={methodLabel(method)} />
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted text-xs font-semibold text-muted-foreground" aria-hidden="true">
                {logoUrl ? <Image src={logoUrl} alt="" width={40} height={40} className="size-full object-cover" /> : methodInitials(method)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground">{methodLabel(method)}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{configured ? "Account details available after selection" : "Account details are not configured"}</span>
              </span>
            </label>
          );
        })}
      </RadioGroup>
      {selectedMethod ? <div className="rounded-xl border border-primary/30 bg-primary/5 p-4" aria-live="polite"><p className="text-sm font-semibold text-foreground">{methodLabel(selectedMethod)} transfer details</p>{selectedMethod.account_number !== null ? <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account name</dt><dd className="mt-1 font-medium text-foreground">{selectedMethod.account_name ?? "Not provided"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account number</dt><dd className="mt-1 font-mono font-medium text-foreground">{selectedMethod.account_number}</dd></div>{selectedMethod.instructions ? <div className="sm:col-span-2"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Instructions</dt><dd className="mt-1 leading-6 text-foreground">{selectedMethod.instructions}</dd></div> : null}</dl> : <p className="mt-2 text-sm text-muted-foreground">This payment method is not configured yet. Choose another method to continue.</p>}</div> : null}
      <FieldError>{error}</FieldError>
    </FieldSet>
  );
}
