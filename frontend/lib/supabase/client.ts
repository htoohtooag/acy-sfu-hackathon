import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

function requireSupabaseConfig(): { url: string; key: string } {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Supabase public environment variables are not configured.");
  }
  return { url: env.NEXT_PUBLIC_SUPABASE_URL, key: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
}

export function createSupabaseBrowserClient() {
  const config = requireSupabaseConfig();
  return createBrowserClient(config.url, config.key);
}
