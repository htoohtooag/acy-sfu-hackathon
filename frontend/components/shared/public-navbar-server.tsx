import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PublicNavbar } from "@/components/shared/public-navbar";

export async function PublicNavbarServer() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return <PublicNavbar isAuthenticated={Boolean(data.user)} />;
}
