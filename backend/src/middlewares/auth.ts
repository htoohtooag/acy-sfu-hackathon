import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { authenticateSupabaseUser, getBearerToken, unauthorizedError } from '../auth/supabase-auth.js';
import { ApiError } from '../utils/api-error.js';

export const requireAuth: RequestHandler = async (
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = getBearerToken(request.get('authorization'));
    request.user = await authenticateSupabaseUser(token);
    next();
  } catch (error: unknown) {
    if (error === unauthorizedError) {
      next(unauthorizedError);
      return;
    }

    if (error instanceof ApiError) {
      next(error);
      return;
    }

    next(error);
  }
};
