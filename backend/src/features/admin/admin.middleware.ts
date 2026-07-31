import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ApiError } from '../../utils/api-error.js';
import { findAdminAssignment } from './admin.repository.js';
import type { AdminRoleName } from './admin.types.js';

export function requireAdminRole(...allowedRoles: AdminRoleName[]): RequestHandler {
  return async (
    request: Request,
    _response: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (request.user === undefined) {
      next(new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.'));
      return;
    }

    try {
      const assignment = await findAdminAssignment(request.user.id);
      const roleName = assignment?.admin_role?.name;
      const hasSuperAdminApplicationRole = request.user.roles.includes('SUPER_ADMIN');
      const superAdminAssignmentWithoutApplicationRole =
        roleName === 'SUPER_ADMIN' && !hasSuperAdminApplicationRole;

      if (
        assignment === null ||
        !assignment.is_active ||
        roleName === undefined ||
        superAdminAssignmentWithoutApplicationRole ||
        !allowedRoles.some((allowedRole: AdminRoleName): boolean => allowedRole === roleName)
      ) {
        next(new ApiError(403, 'ADMIN_ASSIGNMENT_REQUIRED', 'An active administrator assignment is required.'));
        return;
      }

      next();
    } catch (error: unknown) {
      next(error);
    }
  };
}
