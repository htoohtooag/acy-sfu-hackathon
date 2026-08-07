"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateOrderRequest,
  OrderQuoteRequest,
  OrderQuoteResponse,
  OrderResponse,
  PaymentProofFields,
  PaymentResponse,
  PaymentMethodLookup,
} from "shared/schemas";
import { orderQuoteResponseSchema, paymentMethodLookupListSchema, paymentProofFieldsSchema } from "shared/schemas";

import { authenticatedApiRequest } from "@/lib/api-client";

export const checkoutPaymentMethodsQueryKey = ["checkout-payment-methods"] as const;
export const checkoutQuoteQueryKey = (packageId: string) => ["checkout-quote", packageId] as const;

async function getPaymentMethods(signal?: AbortSignal): Promise<PaymentMethodLookup[]> {
  const data: unknown = await authenticatedApiRequest<unknown>("/api/v1/lookups/payment-methods", { signal });
  return paymentMethodLookupListSchema.parse(data);
}

async function getOrderQuote(input: OrderQuoteRequest, signal?: AbortSignal): Promise<OrderQuoteResponse> {
  const data: unknown = await authenticatedApiRequest<unknown>("/api/v1/orders/quote", {
    method: "POST",
    body: JSON.stringify(input),
    signal,
  });
  return orderQuoteResponseSchema.parse(data);
}

async function createPackageOrder(input: CreateOrderRequest): Promise<OrderResponse> {
  return authenticatedApiRequest<OrderResponse>("/api/v1/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

async function submitPaymentProof(input: {
  orderId: string;
  fields: PaymentProofFields;
  screenshot: File;
}): Promise<PaymentResponse> {
  const fields = paymentProofFieldsSchema.parse(input.fields);
  const form = new FormData();
  form.append("amount_mmk", fields.amount_mmk);
  form.append("payment_method_id", fields.payment_method_id);
  if (fields.transaction_ref) form.append("transaction_ref", fields.transaction_ref);
  form.append("screenshot", input.screenshot);

  return authenticatedApiRequest<PaymentResponse>(`/api/v1/orders/${encodeURIComponent(input.orderId)}/payments`, {
    method: "POST",
    body: form,
  });
}

export const checkoutPaymentMethodsQueryOptions = queryOptions({
  queryKey: checkoutPaymentMethodsQueryKey,
  queryFn: ({ signal }) => getPaymentMethods(signal),
  staleTime: 1000 * 60 * 5,
});

export const checkoutQuoteQueryOptions = (packageId: string) => queryOptions({
  queryKey: checkoutQuoteQueryKey(packageId),
  queryFn: ({ signal }) => getOrderQuote({ package_id: packageId }, signal),
  enabled: packageId.length > 0,
  staleTime: 30_000,
});

export function useCheckoutPaymentMethods() {
  return useQuery(checkoutPaymentMethodsQueryOptions);
}

export function useCheckoutQuote(packageId: string) {
  return useQuery(checkoutQuoteQueryOptions(packageId));
}

export function useCreatePackageOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPackageOrder,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workroom-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["recent-workrooms"] });
    },
  });
}

export function useSubmitPaymentProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitPaymentProof,
    onSuccess: (payment) => {
      void queryClient.invalidateQueries({ queryKey: ["workroom-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["recent-workrooms"] });
      void queryClient.invalidateQueries({ queryKey: ["order", payment.order_id] });
    },
  });
}
