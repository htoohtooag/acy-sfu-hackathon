import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),
  SUPABASE_PAYMENT_PROOF_BUCKET: z.string().trim().min(1).default('payment-proofs'),
  PAYMENT_PROOF_MAX_BYTES: z.coerce.number().int().positive().default(10485760),
  SUPABASE_DELIVERABLE_BUCKET: z.string().trim().min(1).default('deliverables'),
  DELIVERABLE_MAX_BYTES: z.coerce.number().int().positive().default(52428800),
  DELIVERABLE_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  SUPABASE_CHAT_ATTACHMENT_BUCKET: z.string().trim().min(1).default('chat-attachments'),
  CHAT_ATTACHMENT_MAX_BYTES: z.coerce.number().int().positive().default(10485760),
  CHAT_ATTACHMENT_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  PAYMENT_KBZ_PAY_ACCOUNT_NAME: z.string().trim().optional(),
  PAYMENT_KBZ_PAY_ACCOUNT_NUMBER: z.string().trim().optional(),
  PAYMENT_KBZ_PAY_INSTRUCTIONS: z.string().trim().optional(),
  PAYMENT_WAVE_MONEY_ACCOUNT_NAME: z.string().trim().optional(),
  PAYMENT_WAVE_MONEY_ACCOUNT_NUMBER: z.string().trim().optional(),
  PAYMENT_WAVE_MONEY_INSTRUCTIONS: z.string().trim().optional(),
  PAYMENT_BANK_TRANSFER_ACCOUNT_NAME: z.string().trim().optional(),
  PAYMENT_BANK_TRANSFER_ACCOUNT_NUMBER: z.string().trim().optional(),
  PAYMENT_BANK_TRANSFER_INSTRUCTIONS: z.string().trim().optional(),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_GENERATION_MODEL: z.string().trim().min(1),
  GEMINI_EMBEDDING_MODEL: z.string().trim().min(1),
  GEMINI_EMBEDDING_OUTPUT_DIMENSIONALITY: z.coerce.number().int().positive().default(1536),
  AI_SEARCH_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  AI_SEARCH_MAX_MESSAGES: z.coerce.number().int().positive().default(20),
  AI_SEARCH_MAX_USER_MESSAGE_CHARS: z.coerce.number().int().positive().default(4000),
  AI_SEARCH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  AI_SEARCH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(10),
});

const parsedEnvironment = envSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error('Invalid backend environment configuration.');
  console.error(parsedEnvironment.error.flatten().fieldErrors);
  throw new Error('Backend environment validation failed.');
}

export const env = parsedEnvironment.data;

export type Environment = typeof env;
