import { Router } from 'express';
import { comparisonController } from '../controllers/comparisonController.js';
import { auth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const comparisonRoutes = Router();

comparisonRoutes.post('/compare', auth, asyncHandler(comparisonController.create));
comparisonRoutes.get('/comparisons', auth, asyncHandler(comparisonController.list));
comparisonRoutes.get('/comparisons/:id', auth, asyncHandler(comparisonController.get));
comparisonRoutes.delete('/comparisons/:id', auth, asyncHandler(comparisonController.remove));
