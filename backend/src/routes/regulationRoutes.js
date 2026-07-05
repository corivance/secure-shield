import { Router } from 'express';
import { regulationController } from '../controllers/regulationController.js';
import { auth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Read-only, available to any authenticated user.
export const regulationRoutes = Router();

regulationRoutes.get('/regulations', auth, asyncHandler(regulationController.list));
