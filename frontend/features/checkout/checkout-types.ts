import type { OrderQuoteResponse, PaymentMethodLookup } from "shared/schemas";

export type CheckoutFormValues = {
  payment_method_id: string;
  transaction_ref: string;
  receipt_file: File | null;
  confirm_transfer: boolean;
};

export type CheckoutFormSubmissionValues = {
  payment_method_id: string;
  transaction_ref: string;
  receipt_file: File;
  confirm_transfer: boolean;
};

export type ReceiptValidationResult = {
  valid: boolean;
  message?: string;
};

export type CheckoutPaymentMethod = PaymentMethodLookup;
export type CheckoutQuote = OrderQuoteResponse;
