import { z } from 'zod';

const requiredText = z.string().trim().min(1);
const moneyString = z.string().regex(/^[0-9]+$/, 'Money must be a nonnegative integer string.');
const positiveMoneyString = z.string().regex(/^[1-9][0-9]*$/, 'Money must be a positive integer string.');
const positiveInt = z.number().int().positive();

export const packageIdSchema = z.object({ id: z.uuid() });
export const jobPostIdSchema = z.object({ id: z.uuid() });

const packageFields = {
  title: requiredText.max(255),
  description: requiredText.max(10000),
  price_mmk: positiveMoneyString,
  delivery_days: positiveInt.max(3650),
  tier_id: z.uuid().nullable().optional(),
  features: z.array(requiredText.max(500)).max(50).optional(),
  is_active: z.boolean().optional(),
};

export const createPackageSchema = z.object({
  title: packageFields.title,
  description: packageFields.description,
  price_mmk: packageFields.price_mmk,
  delivery_days: packageFields.delivery_days,
  tier_id: packageFields.tier_id,
  features: packageFields.features,
});

export const updatePackageSchema = z
  .object({
    title: packageFields.title.optional(),
    description: packageFields.description.optional(),
    price_mmk: packageFields.price_mmk.optional(),
    delivery_days: packageFields.delivery_days.optional(),
    tier_id: packageFields.tier_id,
    features: packageFields.features,
    is_active: packageFields.is_active,
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one package field is required.');

const jobBudgetFields = {
  budget_min_mmk: moneyString.nullable().optional(),
  budget_max_mmk: moneyString.nullable().optional(),
};

const jobFields = {
  title: requiredText.max(255),
  description: requiredText.max(20000),
  expected_deadline: z.iso.date().nullable().optional(),
  status: z.enum(['OPEN', 'HIRING', 'CLOSED']).optional(),
  ...jobBudgetFields,
};

function hasValidBudget(value: {
  budget_min_mmk?: string | null;
  budget_max_mmk?: string | null;
}): boolean {
  if (value.budget_min_mmk === undefined || value.budget_max_mmk === undefined) {
    return true;
  }

  if (value.budget_min_mmk === null || value.budget_max_mmk === null) {
    return true;
  }

  return BigInt(value.budget_min_mmk) <= BigInt(value.budget_max_mmk);
}

export const createJobPostSchema = z
  .object({
    title: jobFields.title,
    description: jobFields.description,
    expected_deadline: jobFields.expected_deadline,
    budget_min_mmk: jobFields.budget_min_mmk,
    budget_max_mmk: jobFields.budget_max_mmk,
  })
  .refine(hasValidBudget, 'Budget minimum cannot exceed budget maximum.');

export const updateJobPostSchema = z
  .object({
    title: jobFields.title.optional(),
    description: jobFields.description.optional(),
    expected_deadline: jobFields.expected_deadline,
    budget_min_mmk: jobFields.budget_min_mmk,
    budget_max_mmk: jobFields.budget_max_mmk,
    status: jobFields.status,
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one job field is required.')
  .refine(hasValidBudget, 'Budget minimum cannot exceed budget maximum.');

export const catalogPageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
});

export const packageListQuerySchema = catalogPageQuerySchema.extend({
  tier_id: z.uuid().optional(),
  min_price_mmk: moneyString.optional(),
  max_price_mmk: moneyString.optional(),
  search: z.string().trim().max(255).optional(),
});

export const jobPostListQuerySchema = catalogPageQuerySchema.extend({
  max_budget_mmk: moneyString.optional(),
  search: z.string().trim().max(255).optional(),
});

export type CreatePackageRequest = z.infer<typeof createPackageSchema>;
export type UpdatePackageRequest = z.infer<typeof updatePackageSchema>;
export type CreateJobPostRequest = z.infer<typeof createJobPostSchema>;
export type UpdateJobPostRequest = z.infer<typeof updateJobPostSchema>;
export type PackageListQuery = z.infer<typeof packageListQuerySchema>;
export type JobPostListQuery = z.infer<typeof jobPostListQuerySchema>;
export type JobPostStatus = 'OPEN' | 'HIRING' | 'CLOSED';

export type CatalogPackage = {
  id: string;
  freelancer_id: string;
  tier_id: string | null;
  title: string;
  description: string | null;
  price_mmk: string;
  delivery_days: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  freelancer: {
    id: string;
    user_id: string;
    headline: string | null;
    location_city: string | null;
    is_verified: boolean;
    user: { id: string; full_name: string | null; avatar_url: string | null };
  };
  tier: { id: string; name: string; display_name: string | null } | null;
};

export type CatalogJobPost = {
  id: string;
  client_id: string;
  title: string;
  description: string;
  budget_min_mmk: string | null;
  budget_max_mmk: string | null;
  expected_deadline: string | null;
  status: JobPostStatus;
  created_at: string;
  updated_at: string;
  client: {
    id: string;
    user_id: string;
    company_name: string | null;
    industry: string | null;
    user: { id: string; full_name: string | null; avatar_url: string | null };
  };
};

export type CatalogPage<TItem> = {
  items: TItem[];
  page: number;
  page_size: number;
  total: number;
};

export type CatalogDeleteResponse = {
  id: string;
  deleted: true;
};

export type CatalogPackageListResponse = CatalogPage<CatalogPackage>;
export type CatalogJobPostListResponse = CatalogPage<CatalogJobPost>;

export type CatalogApiSuccess<TData> = {
  success: true;
  data: TData;
};

export type CatalogApiError = {
  success: false;
  error: { code: string; message: string };
};
