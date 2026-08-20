import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { isCurrentUser, type CurrentUser } from "@/features/auth/auth-data";
import { adminSessionResponseSchema, type AdminSessionResponse } from "shared/schemas";

type SuccessEnvelope = { success: true; data: unknown };

export async function getServerCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return null;

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/users/me`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload: unknown = await response.json();
  if (!isSuccessEnvelope(payload) || !isCurrentUser(payload.data)) return null;
  return payload.data;
}

export async function getServerAdminSession(): Promise<AdminSessionResponse | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/admin/me`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload: unknown = await response.json();
  if (!isSuccessEnvelope(payload)) return null;
  const parsed = adminSessionResponseSchema.safeParse(payload.data);
  return parsed.success ? parsed.data : null;
}

function isSuccessEnvelope(value: unknown): value is SuccessEnvelope {
  return typeof value === "object" && value !== null && "success" in value && value.success === true && "data" in value;
}
