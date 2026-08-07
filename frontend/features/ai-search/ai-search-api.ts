import { DefaultChatTransport, type UIMessage } from "ai";
import {
  aiSearchPackageResultsSchema,
  type AiSearchPackageResults,
} from "shared/schemas";

import { env } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ApiErrorPayload = {
  success: false;
  error?: { code?: string; message?: string };
};

type UnknownRecord = Record<string, unknown>;

export class AiSearchRequestError extends Error {
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "AiSearchRequestError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (!isRecord(value) || value.success !== false) {
    return false;
  }

  return value.error === undefined || isRecord(value.error);
}

async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await globalThis.fetch(input, init);

  if (response.ok) {
    return response;
  }

  const payload: unknown = await response.clone().json().catch(() => null);
  if (isApiErrorPayload(payload)) {
    const errorMessage = payload.error?.message ?? "AI search could not be completed.";
    throw new AiSearchRequestError(errorMessage, payload.error?.code);
  }

  throw new AiSearchRequestError("AI search could not be completed.");
}

async function getAuthorizationHeaders(): Promise<Record<string, string>> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new AiSearchRequestError("Your session could not be verified.", "UNAUTHORIZED");
  }

  const token = data.session?.access_token;
  if (!token) {
    throw new AiSearchRequestError("Your session has expired. Please sign in again.", "UNAUTHORIZED");
  }

  return { Authorization: `Bearer ${token}` };
}

export function createAiSearchTransport(): DefaultChatTransport<UIMessage> {
  return new DefaultChatTransport<UIMessage>({
    api: `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1/ai/search`,
    headers: getAuthorizationHeaders,
    fetch: authenticatedFetch,
  });
}

export function parseAiSearchPackageResults(value: unknown): AiSearchPackageResults | null {
  const result = aiSearchPackageResultsSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function getToolPartName(part: unknown): string | null {
  if (!isRecord(part)) {
    return null;
  }

  if (typeof part.type === "string" && part.type.startsWith("tool-")) {
    return part.type.slice("tool-".length);
  }

  return part.type === "dynamic-tool" && typeof part.toolName === "string" ? part.toolName : null;
}

export function getToolPartState(part: unknown): string | null {
  if (!isRecord(part) || typeof part.state !== "string") {
    return null;
  }

  return part.state;
}

export function getToolPartOutput(part: unknown): unknown {
  return isRecord(part) ? part.output : undefined;
}
