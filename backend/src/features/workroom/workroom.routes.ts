import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { getMessages } from './workroom.controller.js';
import {
  validateWorkroomHistoryQuery,
  validateWorkroomOrderParams,
} from './workroom.validator.js';

export const workroomRouter = Router();

workroomRouter.get(
  '/:id/messages',
  requireAuth,
  validateWorkroomOrderParams,
  validateWorkroomHistoryQuery,
  getMessages,
);
