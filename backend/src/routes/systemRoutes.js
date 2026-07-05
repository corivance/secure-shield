import { Router } from 'express';
import { systemController } from '../controllers/systemController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Public endpoints — no auth.
export const systemRoutes = Router();

systemRoutes.get('/health', asyncHandler(systemController.health));
systemRoutes.get('/system-info', asyncHandler(systemController.info));
systemRoutes.get('/auto-key', asyncHandler(systemController.autoKey));
