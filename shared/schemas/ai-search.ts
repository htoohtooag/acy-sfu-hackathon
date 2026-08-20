import { z } from 'zod';

const MAX_MESSAGES = 20;
const MAX_USER_MESSAGE_CHARS = 4000;

const uiMessagePartSchema = z.unknown();

export const aiSearchMessageSchema = z.object({
  id: z.string().trim().min(1).max(200),
  role: z.enum(['user', 'assistant']),
  parts: z.array(uiMessagePartSchema).min(1).max(100),
}).passthrough();

export type AiSearchMessage = z.infer<typeof aiSearchMessageSchema>;

function isTextPart(value: unknown): value is { type: 'text'; text: string } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return 'type' in value && 'text' in value && value.type === 'text' && typeof value.text === 'string';
}

function textLength(message: AiSearchMessage): number {
  return message.parts.reduce<number>((total, part) => {
    return total + (isTextPart(part) ? part.text.length : 0);
  }, 0);
}

export const aiSearchRequestSchema = z.object({
  messages: z.array(aiSearchMessageSchema).min(1).max(MAX_MESSAGES),
}).superRefine((value, context) => {
  const lastMessage = value.messages.at(-1);

  if (lastMessage?.role !== 'user') {
    context.addIssue({
      code: 'custom',
      path: ['messages'],
      message: 'The final message must be from the user.',
    });
    return;
  }

  const latestTextLength = textLength(lastMessage);
  if (latestTextLength === 0) {
    context.addIssue({
      code: 'custom',
      path: ['messages', 'last', 'parts'],
      message: 'The final user message must contain text.',
    });
  }

  if (latestTextLength > MAX_USER_MESSAGE_CHARS) {
    context.addIssue({
      code: 'custom',
      path: ['messages', 'last', 'parts'],
      message: 'The final user message is too long.',
    });
  }
});

export const searchPackagesToolSchema = z.object({
  query: z.string().trim().min(1).max(MAX_USER_MESSAGE_CHARS),
  skill: z.string().trim().min(1).max(100).optional(),
  location_city: z.string().trim().min(1).max(100).optional(),
  max_budget_mmk: z.string().regex(/^[0-9]+$/, 'Budget must be a nonnegative integer string.').optional(),
});

export const searchPlatformDocsToolSchema = z.object({
  query: z.string().trim().min(1).max(MAX_USER_MESSAGE_CHARS),
});

export type AiSearchRequest = z.infer<typeof aiSearchRequestSchema>;
export type SearchPackagesToolInput = z.infer<typeof searchPackagesToolSchema>;
export type SearchPlatformDocsToolInput = z.infer<typeof searchPlatformDocsToolSchema>;

export const aiSearchPackageCardSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  price_mmk: z.string().regex(/^[0-9]+$/, 'Price must be a nonnegative integer string.'),
  delivery_days: z.number().int().positive(),
  features: z.array(z.string()),
  tier: z
    .object({
      id: z.uuid(),
      name: z.string(),
      display_name: z.string().nullable(),
    })
    .nullable(),
  freelancer: z.object({
    id: z.uuid(),
    name: z.string().nullable(),
    avatar_url: z.string().url().nullable(),
    headline: z.string().nullable(),
    city: z.string().nullable(),
    is_verified: z.boolean(),
    completed_projects_count: z.number().int().nonnegative(),
  }),
  sample_work: z
    .object({
      id: z.uuid(),
      title: z.string(),
      image_url: z.string().url(),
    })
    .nullable(),
});

export const aiSearchPackageResultsSchema = z.array(aiSearchPackageCardSchema).max(5);

export type AiSearchPackageCard = z.infer<typeof aiSearchPackageCardSchema>;
export type AiSearchPackageResults = z.infer<typeof aiSearchPackageResultsSchema>;
