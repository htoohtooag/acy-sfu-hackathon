import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { routeForCurrentUser } from "@/features/auth/auth-data";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");
  const origin = env.NEXT_PUBLIC_SITE_URL;
  if (!code) return NextResponse.redirect(new URL("/login?error=oauth", origin));

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/login?error=oauth", origin));
    const { data: sessionData } = await supabase.auth.getSession();
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/users/me`, { headers: { Authorization: `Bearer ${sessionData.session?.access_token ?? ""}` }, cache: "no-store" });
    const envelope: unknown = await response.json();
    if (!isSuccessEnvelope(envelope)) return NextResponse.redirect(new URL("/onboarding", origin));
    const user = envelope.data;
    const destination = isCurrentUserLike(user) ? routeForCurrentUser(user) : "/onboarding";
    return NextResponse.redirect(new URL(destination, origin));
  } catch { return NextResponse.redirect(new URL("/login?error=callback", origin)); }
}

function isSuccessEnvelope(value: unknown): value is { success: true; data: unknown } { return typeof value === "object" && value !== null && "success" in value && value.success === true && "data" in value; }
function isCurrentUserLike(value: unknown): value is Parameters<typeof routeForCurrentUser>[0] { return typeof value === "object" && value !== null && "id" in value && "email" in value && "roles" in value && typeof value.id === "string" && typeof value.email === "string" && Array.isArray(value.roles); }
