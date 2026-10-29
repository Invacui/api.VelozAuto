/**
 * @file admin.controller.ts
 * @description Admin dashboard + user management HTTP handlers.
 * @module Controllers
 * @author VehicleMarket Backend
 */

import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, buildPagination } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';
import * as adminService from '../services/admin.service';
import * as notificationService from '../services/notification.service';

export const dashboard = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const data = await adminService.getDashboard();
  successResponse(res, data, 'Dashboard data fetched');
});

export const listUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { role, isActive, q } = req.query as Record<string, any>;
  const filter: Record<string, any> = {};
  if (role === 'STAFF') filter.role = { $in: ['EMPLOYEE', 'ADMIN'] };
  else if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive;
  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }, { phone: new RegExp(q, 'i') }];
  const { data, totalItems } = await adminService.listUsers(filter, req.query);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  successResponse(res, data, 'Users fetched', 200, buildPagination(page, limit, totalItems));
});

export const getUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await adminService.getUser(req.params.id);
  successResponse(res, user, 'User fetched');
});

export const updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await adminService.updateUser(req.params.id, req.body, req.user!.id);
  successResponse(res, user, 'User updated');
});

export const listNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { isRead } = req.query as Record<string, any>;
  const filter: Record<string, any> = {};
  if (isRead !== undefined) filter.isRead = isRead;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { data, totalItems } = await notificationService.listNotifications(filter, { page, limit });
  successResponse(res, data, 'Notifications fetched', 200, buildPagination(page, limit, totalItems));
});

export const markNotificationRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const notification = await notificationService.markRead(req.params.id);
  successResponse(res, notification, 'Notification marked read');
});

export const markAllNotificationsRead = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  await notificationService.markAllRead();
  successResponse(res, {}, 'All notifications marked read');
});

export default {
  dashboard,
  listUsers,
  getUser,
  updateUser,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
