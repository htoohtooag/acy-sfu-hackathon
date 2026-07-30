import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ApiError } from '../utils/api-error.js';
import type { ApplicationRole } from '../types/auth.js';

/** Supported application roles are stored in the database, not in JWT metadata. */
export function requireRole(...allowedRoles: ApplicationRole[]): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (request.user === undefined) {
      next(new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.'));
      return;
    }

    const hasAllowedRole = request.user.roles.some((role) => allowedRoles.includes(role));

    if (!hasAllowedRole) {
      next(new ApiError(403, 'FORBIDDEN', 'You do not have access to this resource.'));
      return;
    }

    next();
  };
}
