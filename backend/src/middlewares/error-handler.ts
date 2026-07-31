import type { ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/api-error.js';
import { errorResponse } from '../utils/api-response.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next): void => {
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json(errorResponse('INVALID_JSON', 'Request body must contain valid JSON.'));
    return;
  }

  if (error instanceof ApiError) {
    response.status(error.statusCode).json(errorResponse(error.code, error.message));
    return;
  }

  console.error('Unhandled request error.', error);
  response.status(500).json(
    errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred.'),
  );
};
