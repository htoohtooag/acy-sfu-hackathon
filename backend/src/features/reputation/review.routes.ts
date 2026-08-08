import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { createReview, getReviewStatus } from './review.controller.js';
import { validateCreateReview, validateReviewOrderParams } from './review.validator.js';

export const reviewRouter = Router();

reviewRouter.post(
  '/:id/reviews',
  requireAuth,
  validateReviewOrderParams,
  validateCreateReview,
  createReview,
);

reviewRouter.get(
  '/:id/reviews',
  requireAuth,
  validateReviewOrderParams,
  getReviewStatus,
);
