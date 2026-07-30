import multer from 'multer';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

const supportedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.PAYMENT_PROOF_MAX_BYTES, files: 1 },
  fileFilter: (_request, file, callback): void => {
    if (!supportedImageTypes.has(file.mimetype)) {
      callback(new ApiError(415, 'PAYMENT_PROOF_TYPE_NOT_ALLOWED', 'Only JPEG, PNG, and WebP images are allowed.'));
      return;
    }

    callback(null, true);
  },
});

export const paymentProofUpload: RequestHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  upload.single('screenshot')(request, response, (error: unknown) => {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(new ApiError(413, 'PAYMENT_PROOF_TOO_LARGE', 'The payment proof image is too large.'));
        return;
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        next(new ApiError(422, 'PAYMENT_PROOF_REQUIRED', 'Submit exactly one payment proof image.'));
        return;
      }

      next(new ApiError(422, 'PAYMENT_PROOF_REQUIRED', 'The payment proof upload is invalid.'));
      return;
    }

    if (error !== undefined && error !== null) {
      next(new ApiError(422, 'PAYMENT_PROOF_REQUIRED', 'The payment proof upload is invalid.'));
      return;
    }

    if (request.file === undefined) {
      next(new ApiError(422, 'PAYMENT_PROOF_REQUIRED', 'A payment proof image is required.'));
      return;
    }

    next();
  });
};
