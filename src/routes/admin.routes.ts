/**
 * @file admin.routes.ts
 * @description Admin routes mounted at /api/v1/admin.
 * @module Routes
 * @author VehicleMarket Backend
 */

import { Router } from 'express';
import validate from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import * as adminController from '../controllers/admin.controller';
import {
  listUsersQuerySchema,
  updateUserSchema,
  notificationIdParamSchema,
} from '../validators/admin.validator';
import { idParamSchema } from '../validators/common.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'EMPLOYEE'));

router.get('/dashboard', adminController.dashboard);

router.get('/users', requireRole('ADMIN'), validate({ query: listUsersQuerySchema }), adminController.listUsers);
router.get('/users/:id', requireRole('ADMIN'), validate({ params: idParamSchema }), adminController.getUser);
router.patch('/users/:id', requireRole('ADMIN'), validate({ params: idParamSchema, body: updateUserSchema }), adminController.updateUser);

router.get('/notifications', requireRole('ADMIN'), adminController.listNotifications);
router.patch('/notifications/:id/read', requireRole('ADMIN'), validate({ params: notificationIdParamSchema }), adminController.markNotificationRead);
router.patch('/notifications/read-all', requireRole('ADMIN'), adminController.markAllNotificationsRead);

export default router;
