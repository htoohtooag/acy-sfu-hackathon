import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { chatAttachmentUpload, deliverableUpload } from '../../middlewares/upload.js';
import { decide, download, preview, submit } from './deliverable.controller.js';
import { getMessages, uploadMessageImage } from './workroom.controller.js';
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
  '/:id/messages/upload',
  requireAuth,
  validateWorkroomOrderParams,
  chatAttachmentUpload,
  uploadMessageImage,
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

workroomRouter.get(
  '/:id/deliverables/:deliverableId/preview',
  requireAuth,
  validateDeliverableDecisionParams,
  preview,
);

workroomRouter.get(
  '/:id/deliverables/:deliverableId/download',
  requireAuth,
  validateDeliverableDecisionParams,
  download,
);
