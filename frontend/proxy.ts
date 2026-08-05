import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";

const authEntryPaths = new Set(["/login", "/signup", "/signup/account"]);

export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isDashboardRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isOnboardingRoute = pathname === "/onboarding" || pathname.startsWith("/onboarding/");

  if (data.user && authEntryPaths.has(pathname)) return redirectWithCookies("/dashboard", request, response);
  if (!data.user && (isDashboardRoute || isOnboardingRoute)) return redirectWithCookies("/login", request, response);
  return response;
}

function redirectWithCookies(pathname: string, request: NextRequest, source: NextResponse): NextResponse {
  const redirectResponse = NextResponse.redirect(new URL(pathname, request.url));
  source.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)"] };
