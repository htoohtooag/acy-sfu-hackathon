import { z } from 'zod';

export const dashboardRoleSchema = z.enum(['client', 'freelancer']);
export const dashboardQuerySchema = z.object({ role: dashboardRoleSchema }).strict();
export const dashboardActionSchema = z.enum([
  'VIEW_ESCROW_STATUS',
  'OPEN_WORKROOM',
  'REVIEW_DELIVERABLE',
  'VIEW_REVIEW_STATUS',
]);
export const dashboardMetricKeySchema = z.enum(['AWAITING_ESCROW', 'ACTIVE_WORK', 'IN_REVIEW']);

const dashboardParticipantSchema = z.object({
  id: z.uuid(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
}).strict();

const dashboardMetricSchema = z.object({
  key: dashboardMetricKeySchema,
  label: z.string(),
  count: z.number().int().nonnegative(),
}).strict();

const dashboardAttentionItemSchema = z.object({
  order_id: z.uuid(),
  title: z.string(),
  source_type: z.enum(['PACKAGE', 'CUSTOM_OFFER']),
  participant: dashboardParticipantSchema,
  status: z.enum(['AWAITING_ESCROW', 'ACTIVE', 'IN_REVIEW']),
  amount_mmk: z.string().regex(/^[0-9]+$/),
  updated_at: z.iso.datetime({ offset: true }),
  action: dashboardActionSchema,
}).strict();

export const dashboardSummarySchema = z.object({
  role: dashboardRoleSchema,
  metrics: z.array(dashboardMetricSchema).length(3),
  attention_items: z.array(dashboardAttentionItemSchema).max(5),
}).strict();

export type DashboardRole = z.infer<typeof dashboardRoleSchema>;
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
export type DashboardAction = z.infer<typeof dashboardActionSchema>;
export type DashboardMetricKey = z.infer<typeof dashboardMetricKeySchema>;
export type DashboardMetric = z.infer<typeof dashboardMetricSchema>;
export type DashboardAttentionItem = z.infer<typeof dashboardAttentionItemSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
