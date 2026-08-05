import { z } from 'zod';

export const packageTierLookupSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(50),
  display_name: z.string().trim().max(100).nullable(),
  sort_order: z.number().int().nonnegative(),
});

export const packageTierLookupListSchema = z.array(packageTierLookupSchema);

export type PackageTierLookup = z.infer<typeof packageTierLookupSchema>;

