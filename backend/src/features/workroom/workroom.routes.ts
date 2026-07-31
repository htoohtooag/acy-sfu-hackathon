import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { deliverableUpload } from '../../middlewares/upload.js';
import { decide, submit } from './deliverable.controller.js';
import { getMessages } from './workroom.controller.js';
import {
  validateDeliverableDecision,
  validateDeliverableDecisionParams,
  validateDeliverableOrderParams,
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

workroomRouter.post(
  '/:id/deliverables',
  requireAuth,
  validateDeliverableOrderParams,
  deliverableUpload,
  submit,
);

workroomRouter.patch(
  '/:id/deliverables/:deliverableId',
  requireAuth,
  validateDeliverableDecisionParams,
  validateDeliverableDecision,
  decide,
);
