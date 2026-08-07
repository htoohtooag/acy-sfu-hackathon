import { z } from 'zod';

export const packageTierLookupSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(50),
  display_name: z.string().trim().max(100).nullable(),
  sort_order: z.number().int().nonnegative(),
});

export const packageTierLookupListSchema = z.array(packageTierLookupSchema);

export type PackageTierLookup = z.infer<typeof packageTierLookupSchema>;

export const paymentMethodLookupSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(50),
  display_name: z.string().trim().max(100).nullable(),
  logo_url: z.url().nullable(),
  account_name: z.string().trim().max(255).nullable(),
  account_number: z.string().trim().max(255).nullable(),
  instructions: z.string().trim().max(1000).nullable(),
}).strict();

export const paymentMethodLookupListSchema = z.array(paymentMethodLookupSchema);

export type PaymentMethodLookup = z.infer<typeof paymentMethodLookupSchema>;
