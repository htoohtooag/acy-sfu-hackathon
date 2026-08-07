import multer from 'multer';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

const supportedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const deliverableUploadParser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.DELIVERABLE_MAX_BYTES, files: 1 },
  fileFilter: (_request, file, callback): void => {
    if (!supportedImageTypes.has(file.mimetype)) {
      callback(new ApiError(415, 'DELIVERABLE_TYPE_NOT_ALLOWED', 'Only JPEG, PNG, and WebP images are allowed.'));
      return;
    }

    callback(null, true);
  },
});

const chatAttachmentUploadParser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.CHAT_ATTACHMENT_MAX_BYTES, files: 1 },
  fileFilter: (_request, file, callback): void => {
    if (!supportedImageTypes.has(file.mimetype)) {
      callback(new ApiError(415, 'CHAT_ATTACHMENT_TYPE_NOT_ALLOWED', 'Only JPEG, PNG, and WebP images are allowed.'));
      return;
    }

    callback(null, true);
  },
});

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

export const deliverableUpload: RequestHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  deliverableUploadParser.single('file')(request, response, (error: unknown) => {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(new ApiError(413, 'DELIVERABLE_TOO_LARGE', 'The deliverable image is too large.'));
        return;
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        next(new ApiError(422, 'DELIVERABLE_REQUIRED', 'Submit exactly one deliverable image.'));
        return;
      }

      next(new ApiError(422, 'DELIVERABLE_UPLOAD_INVALID', 'The deliverable upload is invalid.'));
      return;
    }

    if (error !== undefined && error !== null) {
      next(new ApiError(422, 'DELIVERABLE_UPLOAD_INVALID', 'The deliverable upload is invalid.'));
      return;
    }

    if (request.file === undefined) {
      next(new ApiError(422, 'DELIVERABLE_REQUIRED', 'A deliverable image is required.'));
      return;
    }

    next();
  });
};

export const chatAttachmentUpload: RequestHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  chatAttachmentUploadParser.single('file')(request, response, (error: unknown) => {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(new ApiError(413, 'CHAT_ATTACHMENT_TOO_LARGE', 'The chat image is too large.'));
        return;
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        next(new ApiError(422, 'CHAT_ATTACHMENT_REQUIRED', 'Submit exactly one chat image.'));
        return;
      }

      next(new ApiError(422, 'CHAT_ATTACHMENT_UPLOAD_INVALID', 'The chat image upload is invalid.'));
      return;
    }

    if (error !== undefined && error !== null) {
      next(new ApiError(422, 'CHAT_ATTACHMENT_UPLOAD_INVALID', 'The chat image upload is invalid.'));
      return;
    }

    if (request.file === undefined) {
      next(new ApiError(422, 'CHAT_ATTACHMENT_REQUIRED', 'A chat image is required.'));
      return;
    }

    next();
  });
};
