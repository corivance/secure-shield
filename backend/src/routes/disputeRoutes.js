import { Router } from 'express';
import { disputeController } from '../controllers/disputeController.js';
import { auth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const disputeRoutes = Router();

disputeRoutes.post('/dispute-claim', auth, requirePermission('dispute.create'), asyncHandler(disputeController.create));
disputeRoutes.get('/disputes/:id', auth, requirePermission('dispute.create'), asyncHandler(disputeController.get));
disputeRoutes.get('/download-report/:filename', auth, asyncHandler(disputeController.download));
