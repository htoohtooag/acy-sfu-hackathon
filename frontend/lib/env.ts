import { z } from "zod";

const environmentSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3001"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

const parsedEnvironment = environmentSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsedEnvironment.success) {
  throw new Error("Invalid frontend environment configuration.");
}

export const env = parsedEnvironment.data;

export type FrontendEnvironment = typeof env;
