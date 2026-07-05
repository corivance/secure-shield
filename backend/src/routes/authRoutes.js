import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { userKeyController } from '../controllers/userKeyController.js';
import { auth } from '../middlewares/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRoutes = Router();

authRoutes.post('/signup', asyncHandler(authController.signup));
authRoutes.post('/login', asyncHandler(authController.login));
authRoutes.post('/refresh', asyncHandler(authController.refresh));
authRoutes.post('/logout', auth, asyncHandler(authController.logout));
authRoutes.get('/me', auth, asyncHandler(authController.me));
authRoutes.patch('/profile', auth, asyncHandler(authController.updateProfile));
authRoutes.post('/change-password', auth, asyncHandler(authController.changePassword));
authRoutes.get('/me/api-keys', auth, asyncHandler(userKeyController.list));
authRoutes.post('/me/api-keys/request', auth, asyncHandler(userKeyController.requestAccess));
authRoutes.patch('/me/api-keys/:keyName', auth, asyncHandler(userKeyController.update));
