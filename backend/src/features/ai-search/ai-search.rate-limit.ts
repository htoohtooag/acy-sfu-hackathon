import type { RequestHandler } from 'express';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/api-error.js';

type RateLimitEntry = {
  count: number;
  startedAt: number;
};

const entries = new Map<string, RateLimitEntry>();

export const aiSearchRateLimit: RequestHandler = (request, _response, next): void => {
  const userId = request.user?.id;
  if (userId === undefined) {
    next(new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.'));
    return;
  }

  const now = Date.now();
  const ipAddress = request.ip || 'unknown';
  const key = `${userId}:${ipAddress}`;

  for (const [entryKey, entry] of entries) {
    if (now - entry.startedAt >= env.AI_SEARCH_RATE_LIMIT_WINDOW_MS) {
      entries.delete(entryKey);
    }
  }

  const existing = entries.get(key);
  if (existing === undefined || now - existing.startedAt >= env.AI_SEARCH_RATE_LIMIT_WINDOW_MS) {
    entries.set(key, { count: 1, startedAt: now });
    next();
    return;
  }

  if (existing.count >= env.AI_SEARCH_RATE_LIMIT_MAX_REQUESTS) {
    next(new ApiError(429, 'AI_SEARCH_RATE_LIMITED', 'Too many AI search requests.'));
    return;
  }

  existing.count += 1;
  next();
};

export function clearAiSearchRateLimit(): void {
  entries.clear();
}
