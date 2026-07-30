import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { validateParams } from '../../middlewares/validate.js';
import { jobPostIdSchema } from 'shared/schemas';
import { validateCreateJob, validateJobQuery, validateUpdateJob } from './catalog.validator.js';
import { createJob, deleteJob, getJob, listJobs, updateJob } from './job.controller.js';

export const jobRouter = Router();

jobRouter.get('/', validateJobQuery, listJobs);
jobRouter.get('/:id', validateParams(jobPostIdSchema), getJob);
jobRouter.post('/', requireAuth, requireRole('CLIENT'), validateCreateJob, createJob);
jobRouter.patch('/:id', requireAuth, requireRole('CLIENT'), validateParams(jobPostIdSchema), validateUpdateJob, updateJob);
jobRouter.delete('/:id', requireAuth, requireRole('CLIENT'), validateParams(jobPostIdSchema), deleteJob);
