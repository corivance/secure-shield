import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { policyRoutes } from './policyRoutes.js';
import { eligibilityRoutes } from './eligibilityRoutes.js';
import { disputeRoutes } from './disputeRoutes.js';
import { chatRoutes } from './chatRoutes.js';
import { auditRoutes } from './auditRoutes.js';
import { systemRoutes } from './systemRoutes.js';
import { notificationRoutes } from './notificationRoutes.js';
import { regulationRoutes } from './regulationRoutes.js';
import { planRoutes } from './planRoutes.js';
import { adminRoutes } from './adminRoutes.js';
import { comparisonRoutes } from './comparisonRoutes.js';

export const router = Router();

router.use('/auth', authRoutes);
router.use('/', systemRoutes);
router.use('/', policyRoutes);
router.use('/', eligibilityRoutes);
router.use('/', disputeRoutes);
router.use('/', chatRoutes);
router.use('/', auditRoutes);
router.use('/', notificationRoutes);
router.use('/', regulationRoutes);
router.use('/', planRoutes);
router.use('/', adminRoutes);
router.use('/', comparisonRoutes);
