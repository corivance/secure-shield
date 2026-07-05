import { Router } from 'express';
import { planController } from '../controllers/planController.js';
import { auth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const planRoutes = Router();

planRoutes.get('/plans', auth, asyncHandler(planController.list));
planRoutes.post('/plans/checkout', auth, asyncHandler(planController.checkout));
planRoutes.post('/plans/verify', auth, asyncHandler(planController.verify));
