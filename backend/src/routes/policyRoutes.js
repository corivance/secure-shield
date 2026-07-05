import { Router } from 'express';
import { policyController } from '../controllers/policyController.js';
import { auth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/rbac.js';
import { uploadPdf } from '../middlewares/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const policyRoutes = Router();

policyRoutes.post('/upload-policy', auth, requirePermission('policy.create'), uploadPdf, asyncHandler(policyController.upload));
policyRoutes.get('/policies', auth, requirePermission('policy.read'), asyncHandler(policyController.list));
policyRoutes.get('/policies/:id', auth, requirePermission('policy.read'), asyncHandler(policyController.get));
policyRoutes.patch('/policies/:id', auth, requirePermission('policy.create'), asyncHandler(policyController.update));
policyRoutes.delete('/policies/:id', auth, requirePermission('policy.create'), asyncHandler(policyController.remove));
