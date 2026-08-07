import { z } from "zod";

import type { CheckoutFormValues, ReceiptValidationResult } from "./checkout-types";

export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_RECEIPT_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
const acceptedReceiptTypes = new Set<string>(ACCEPTED_RECEIPT_TYPES);

const receiptFileSchema = z.custom<File | null>(
  (value) => value === null || (typeof File !== "undefined" && value instanceof File),
  "Choose a payment proof file.",
).refine((file) => file !== null, "Choose a payment proof file.");

export const checkoutFormSchema = z.object({
  payment_method_id: z.uuid("Choose a payment method."),
  transaction_ref: z.string().trim().min(1, "Enter the transaction reference.").max(255, "Transaction reference is too long."),
  receipt_file: receiptFileSchema,
  confirm_transfer: z.boolean().refine((value) => value, "Confirm that you transferred the exact amount."),
}).strict();

export function validateReceiptFile(file: File | null): ReceiptValidationResult {
  if (file === null) return { valid: false, message: "Choose a payment proof file." };
  if (!acceptedReceiptTypes.has(file.type)) {
    return { valid: false, message: "Use a JPEG, PNG, or PDF payment proof." };
  }
  if (file.size > MAX_RECEIPT_BYTES) return { valid: false, message: "Payment proof must be 5 MB or smaller." };
  return { valid: true };
}

export function getCheckoutDefaultValues(): CheckoutFormValues {
  return {
    payment_method_id: "",
    transaction_ref: "",
    receipt_file: null,
    confirm_transfer: false,
  };
}
