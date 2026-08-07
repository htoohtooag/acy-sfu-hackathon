"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { CatalogPackage } from "shared/schemas";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/features/app/app-api";
import { useCheckoutPaymentMethods, useCheckoutQuote, useCreatePackageOrder, useSubmitPaymentProof } from "@/features/checkout/checkout-api";
import { checkoutFormSchema, getCheckoutDefaultValues, validateReceiptFile } from "@/features/checkout/checkout-validation";
import type { CheckoutFormSubmissionValues, CheckoutFormValues } from "@/features/checkout/checkout-types";
import { ApiRequestError } from "@/lib/api-client";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckoutConfirmationDialog } from "./checkout-confirmation-dialog";
import { CheckoutSummary } from "./checkout-summary";
import { PaymentMethodSelector } from "./payment-method-selector";
import { PaymentProofField } from "./payment-proof-field";

interface CheckoutPageProps {
  packageItem: CatalogPackage;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error) return error.message;
  return "Checkout could not be completed. Please try again.";
}

function formatMmk(value: string): string {
  return `${new Intl.NumberFormat("en-US").format(Number(value))} MMK`;
}

export function CheckoutPage({ packageItem }: CheckoutPageProps) {
  const router = useRouter();
  const userQuery = useCurrentUser();
  const methodsQuery = useCheckoutPaymentMethods();
  const quoteQuery = useCheckoutQuote(packageItem.id);
  const createOrderMutation = useCreatePackageOrder();
  const paymentMutation = useSubmitPaymentProof();
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { control, getValues, handleSubmit, register, setError, formState: { errors, isValid } } = useForm<CheckoutFormValues, unknown, CheckoutFormSubmissionValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: getCheckoutDefaultValues(),
    mode: "onChange",
  });
  const methods = methodsQuery.data ?? [];
  console.log(methods, "methods ")
  const selectedMethodId = useWatch({ control, name: "payment_method_id" });
  const selectedMethod = methods.find((method) => method.id === selectedMethodId);
  const receipt = useWatch({ control, name: "receipt_file" });
  const pending = createOrderMutation.isPending || paymentMutation.isPending;
  const unavailable = userQuery.data !== undefined && !userQuery.data.roles.includes("CLIENT");

  async function submitCheckout(values: CheckoutFormSubmissionValues): Promise<void> {
    const receiptResult = validateReceiptFile(values.receipt_file);
    if (!receiptResult.valid) {
      setError("receipt_file", { type: "validate", message: receiptResult.message ?? "Choose a valid payment proof file." });
      return;
    }
    if (!quoteQuery.data) {
      setError("root", { type: "validate", message: "The order amount is not ready yet. Refresh and try again." });
      return;
    }
    setConfirmationOpen(true);
  }

  async function confirmCheckout(): Promise<void> {
    const values = getValues();
    if (!values.receipt_file || !quoteQuery.data || !selectedMethod) return;
    try {
      const currentOrder = orderId ? { id: orderId, agreed_price_mmk: quoteQuery.data.agreed_price_mmk } : await createOrderMutation.mutateAsync({ package_id: packageItem.id });
      setOrderId(currentOrder.id);
      await paymentMutation.mutateAsync({
        orderId: currentOrder.id,
        fields: {
          amount_mmk: currentOrder.agreed_price_mmk,
          payment_method_id: values.payment_method_id,
          transaction_ref: values.transaction_ref.trim(),
        },
        screenshot: values.receipt_file,
      });
      setConfirmationOpen(false);
      setSuccessMessage("Payment proof submitted. Waiting for admin verification…");
      router.replace(`/messages/${encodeURIComponent(currentOrder.id)}`);
    } catch (error: unknown) {
      setConfirmationOpen(false);
      setError("root", { type: "server", message: errorMessage(error) });
    }
  }

  if (userQuery.isPending) return <div className="flex min-h-96 items-center justify-center" role="status"><Spinner /> <span className="sr-only">Loading checkout</span></div>;
  if (unavailable) return <Alert variant="destructive"><AlertTitle>Client access required</AlertTitle><AlertDescription>Only a client account can start a package order.</AlertDescription></Alert>;
  if (methodsQuery.isError || quoteQuery.isError) return <Alert variant="destructive"><AlertTitle>Checkout is unavailable</AlertTitle><AlertDescription>{errorMessage(methodsQuery.error ?? quoteQuery.error)}</AlertDescription></Alert>;

  return <section className="mx-auto flex w-full max-w-6xl flex-col gap-8"><header className="flex flex-col gap-2"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Secure checkout</p><h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Fund your next project</h1><p className="max-w-2xl text-sm leading-6 text-muted-foreground">Transfer the exact package amount, then upload your receipt for admin escrow verification.</p></header>{successMessage ? <Alert><AlertTitle>Payment proof submitted</AlertTitle><AlertDescription>{successMessage}</AlertDescription></Alert> : null}<form className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" onSubmit={(event) => { void handleSubmit(submitCheckout)(event); }}><CheckoutSummary packageItem={packageItem} quote={quoteQuery.data} loading={quoteQuery.isPending} /><Card><CardHeader><CardTitle>Payment proof</CardTitle><CardDescription>Use one of the configured payment accounts and keep your transaction reference ready.</CardDescription></CardHeader><CardContent><FieldGroup><Controller control={control} name="payment_method_id" render={({ field }) => <PaymentMethodSelector methods={methods} value={field.value} onChange={(value) => field.onChange(value)} disabled={pending || methodsQuery.isPending} error={errors.payment_method_id?.message} />} /><Field data-invalid={Boolean(errors.transaction_ref)}><FieldLabel htmlFor="transaction-reference">Transaction reference</FieldLabel><Input id="transaction-reference" placeholder="TXN-123456" aria-invalid={Boolean(errors.transaction_ref)} disabled={pending} {...register("transaction_ref")} /><FieldDescription>Enter the transaction id shown by your payment provider.</FieldDescription><FieldError>{errors.transaction_ref?.message}</FieldError></Field><Controller control={control} name="receipt_file" render={({ field }) => <PaymentProofField value={field.value} onChange={(file) => { field.onChange(file); const result = validateReceiptFile(file); if (!result.valid) setError("receipt_file", { type: "validate", message: result.message }); }} error={errors.receipt_file?.message} />} /><Controller control={control} name="confirm_transfer" render={({ field }) => <Field data-invalid={Boolean(errors.confirm_transfer)} className="flex-row items-start gap-3"><Checkbox id="confirm-transfer" checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} aria-invalid={Boolean(errors.confirm_transfer)} disabled={pending} /><div className="flex flex-col gap-1"><FieldLabel htmlFor="confirm-transfer">I confirm I transferred the exact amount</FieldLabel><FieldDescription>This acknowledgement is required before submitting proof.</FieldDescription><FieldError>{errors.confirm_transfer?.message}</FieldError></div></Field>} />{errors.root?.message ? <Alert variant="destructive"><AlertTitle>Submission could not be completed</AlertTitle><AlertDescription>{errors.root.message}</AlertDescription></Alert> : null}<Button type="submit" size="lg" disabled={pending || !isValid || !quoteQuery.data || !selectedMethod?.account_number}>{pending ? <><Spinner data-icon="inline-start" /> Submitting proof…</> : "Review and submit proof"}</Button></FieldGroup></CardContent></Card></form><CheckoutConfirmationDialog open={confirmationOpen} pending={pending} amount={quoteQuery.data ? formatMmk(quoteQuery.data.agreed_price_mmk) : "the exact package amount"} paymentMethod={selectedMethod?.display_name ?? selectedMethod?.name ?? "selected payment method"} fileName={receipt?.name ?? "your receipt"} onOpenChange={setConfirmationOpen} onConfirm={() => { void confirmCheckout(); }} /></section>;
}
