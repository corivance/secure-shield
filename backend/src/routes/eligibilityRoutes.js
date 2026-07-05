import { Router } from 'express';
import { eligibilityController } from '../controllers/eligibilityController.js';
import { auth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const eligibilityRoutes = Router();

eligibilityRoutes.post('/check-eligibility', auth, requirePermission('eligibility.run'), asyncHandler(eligibilityController.check));
eligibilityRoutes.get('/history', auth, requirePermission('eligibility.read'), asyncHandler(eligibilityController.history));
eligibilityRoutes.get('/checks/:id', auth, requirePermission('eligibility.read'), asyncHandler(eligibilityController.get));
