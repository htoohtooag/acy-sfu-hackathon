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

export function validateQuery<TSchema extends ZodType<unknown>>(
  schema: TSchema,
): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.query);

    if (!result.success) {
      next(new ApiError(422, 'VALIDATION_ERROR', 'Request query is invalid.'));
      return;
    }

    Object.assign(request.query, result.data);
    next();
  };
}

export function validateParams<TSchema extends ZodType<unknown>>(
  schema: TSchema,
): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.params);

    if (!result.success) {
      next(new ApiError(422, 'VALIDATION_ERROR', 'Request parameters are invalid.'));
      return;
    }

    Object.assign(request.params, result.data);
    next();
  };
}
