import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { validateParams } from '../../middlewares/validate.js';
import {
  validateCreatePackage,
  validatePackageQuery,
  validateUpdatePackage,
} from './catalog.validator.js';
import { createPackage, deletePackage, getPackage, listPackages, updatePackage } from './package.controller.js';
import { packageIdSchema } from 'shared/schemas';

export const packageRouter = Router();

packageRouter.get('/', validatePackageQuery, listPackages);
packageRouter.get('/:id', validateParams(packageIdSchema), getPackage);
packageRouter.post('/', requireAuth, requireRole('FREELANCER'), validateCreatePackage, createPackage);
packageRouter.patch('/:id', requireAuth, requireRole('FREELANCER'), validateParams(packageIdSchema), validateUpdatePackage, updatePackage);
packageRouter.delete('/:id', requireAuth, requireRole('FREELANCER'), validateParams(packageIdSchema), deletePackage);
