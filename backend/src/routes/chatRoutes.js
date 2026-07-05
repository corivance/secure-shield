import { Router } from 'express';
import { chatController } from '../controllers/chatController.js';
import { auth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const chatRoutes = Router();

chatRoutes.post('/chat', auth, requirePermission('chat.use'), asyncHandler(chatController.ask));
chatRoutes.get('/chat/history', auth, requirePermission('chat.use'), asyncHandler(chatController.history));
