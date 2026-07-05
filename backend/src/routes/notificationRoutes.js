import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { auth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const notificationRoutes = Router();

notificationRoutes.get('/notifications', auth, asyncHandler(notificationController.list));
notificationRoutes.get('/notifications/unread-count', auth, asyncHandler(notificationController.unreadCount));
notificationRoutes.post('/notifications/read-all', auth, asyncHandler(notificationController.markAllRead));
notificationRoutes.patch('/notifications/:id/read', auth, asyncHandler(notificationController.markRead));
