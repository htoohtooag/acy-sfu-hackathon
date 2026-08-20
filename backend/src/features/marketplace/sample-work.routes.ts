import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { sampleWorkUpload } from '../../middlewares/upload.js';
import { createSampleWork, deleteSampleWork, listSampleWorks, reorderSampleWork, updateSampleWork } from './sample-work.controller.js';
import { validateSampleWorkId } from './sample-work.validator.js';

export const sampleWorkRouter = Router();
sampleWorkRouter.use(requireAuth, requireRole('FREELANCER'));
sampleWorkRouter.get('/', listSampleWorks);
sampleWorkRouter.post('/', sampleWorkUpload, createSampleWork);
sampleWorkRouter.patch('/:sampleId', validateSampleWorkId, sampleWorkUpload, updateSampleWork);
sampleWorkRouter.delete('/:sampleId', validateSampleWorkId, deleteSampleWork);
sampleWorkRouter.put('/order', reorderSampleWork);
