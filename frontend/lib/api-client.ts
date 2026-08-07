import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { env } from "@/lib/env";

type ApiErrorBody = { code?: string; message?: string; details?: unknown };
type ApiEnvelope<T> = { success: true; data: T } | { success: false; error: ApiErrorBody };

export class ApiRequestError extends Error {
  readonly code: string | undefined;
  readonly details: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.details = details;
  }
}

function apiUrl(path: string): string {
  return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}${path}`;
}

export async function authenticatedApiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ApiRequestError("Your session has expired. Please sign in again.", "UNAUTHORIZED");

  const isMultipart = typeof FormData !== "undefined" && init.body instanceof FormData;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  if (!isMultipart && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!isEnvelope<T>(payload)) throw new ApiRequestError("The server returned an invalid response.");
  if (!payload.success) throw new ApiRequestError(payload.error.message ?? "The request could not be completed.", payload.error.code, payload.error.details);
  return payload.data;
}

function isEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  if (typeof value !== "object" || value === null || !("success" in value)) return false;
  return value.success === true ? "data" in value : "error" in value;
}
