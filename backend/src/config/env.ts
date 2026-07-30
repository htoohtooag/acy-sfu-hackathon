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
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_EMBEDDING_MODEL: z.string().trim().min(1),
  GEMINI_EMBEDDING_OUTPUT_DIMENSIONALITY: z.coerce.number().int().positive().default(1536),
});

const parsedEnvironment = envSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error('Invalid backend environment configuration.');
  console.error(parsedEnvironment.error.flatten().fieldErrors);
  throw new Error('Backend environment validation failed.');
}

export const env = parsedEnvironment.data;

export type Environment = typeof env;
