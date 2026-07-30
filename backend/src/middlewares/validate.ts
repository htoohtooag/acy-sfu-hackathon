import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';
import { ApiError } from '../utils/api-error.js';

export function validateBody<TSchema extends ZodType<unknown>>(
  schema: TSchema,
): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      next(new ApiError(422, 'VALIDATION_ERROR', 'Request body is invalid.'));
      return;
    }

    request.body = result.data;
    next();
  };
}
