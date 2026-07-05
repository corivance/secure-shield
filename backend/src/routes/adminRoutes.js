import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { auth } from '../middlewares/auth.js';
import { requireSuperAdmin } from '../middlewares/rbac.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Every admin route requires an authenticated super-admin.
export const adminRoutes = Router();

adminRoutes.use(auth, requireSuperAdmin);

adminRoutes.get('/admin/users', asyncHandler(adminController.listUsers));
adminRoutes.get('/admin/users/:id', asyncHandler(adminController.getUser));
adminRoutes.patch('/admin/users/:id', asyncHandler(adminController.updateUser));
adminRoutes.delete('/admin/users/:id', asyncHandler(adminController.deleteUser));

adminRoutes.get('/admin/api-keys', asyncHandler(adminController.listApiKeys));
adminRoutes.patch('/admin/api-keys/:keyName', asyncHandler(adminController.updateApiKey));

adminRoutes.get('/admin/plans', asyncHandler(adminController.listPlans));
adminRoutes.post('/admin/plans', asyncHandler(adminController.createPlan));
adminRoutes.patch('/admin/plans/:id', asyncHandler(adminController.updatePlan));
adminRoutes.delete('/admin/plans/:id', asyncHandler(adminController.deletePlan));

adminRoutes.get('/admin/regulations', asyncHandler(adminController.listRegulations));
adminRoutes.post('/admin/regulations/fetch-updates', asyncHandler(adminController.fetchRegulationUpdates));
adminRoutes.post('/admin/regulations/run-watch', asyncHandler(adminController.runRegulationWatch));
adminRoutes.post('/admin/regulations/insert-circulars', asyncHandler(adminController.insertCirculars));
adminRoutes.post('/admin/regulations/extract-circular', asyncHandler(adminController.extractCircular));
adminRoutes.post('/admin/regulations', asyncHandler(adminController.createRegulation));
adminRoutes.patch('/admin/regulations/:id', asyncHandler(adminController.updateRegulation));
adminRoutes.delete('/admin/regulations/:id', asyncHandler(adminController.deleteRegulation));

adminRoutes.get('/admin/translations', asyncHandler(adminController.listTranslations));
adminRoutes.patch('/admin/translations', asyncHandler(adminController.setTranslation));
