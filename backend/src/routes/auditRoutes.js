import { Router } from 'express';
import { auditController } from '../controllers/auditController.js';
import { auth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const auditRoutes = Router();

auditRoutes.get('/audit-trail', auth, requirePermission('audit.read'), asyncHandler(auditController.trail));
auditRoutes.get('/audit-trail/:runId', auth, requirePermission('audit.read'), asyncHandler(auditController.run));
