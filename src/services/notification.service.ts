/**
 * @file notification.service.ts
 * @description Admin notification service — persists a notification and pushes
 *              it to connected admins/employees over socket.io.
 * @module Services
 * @author VehicleMarket Backend
 */

import * as notificationDao from '../dao/notification.dao';
import { emitToAdmins } from '../socket/index';
import { PaginationParams } from '../interfaces/request.interface';
import logger from '../logger/index';

export const createAdminNotification = async (
  type: string,
  title: string,
  body?: string,
  link?: string
) => {
  const notification = await notificationDao.create({ type, title, body, link });
  emitToAdmins('admin:notification', notification);
  logger.info(`Admin notification: ${title}`, {
    fileName: 'notification.service.ts',
    methodName: 'createAdminNotification',
    type,
  });
  return notification;
};

export const listNotifications = async (
  filter: Record<string, any> = {},
  pagination: PaginationParams = {}
) => {
  const data = await notificationDao.findAll(filter, pagination);
  const totalItems = await notificationDao.countAll(filter);
  return { data, totalItems };
};

export const markRead = (id: string) => notificationDao.markRead(id);

export const markAllRead = () => notificationDao.markAllRead();

export const unreadCount = () => notificationDao.countUnread();

export default {
  createAdminNotification,
  listNotifications,
  markRead,
  markAllRead,
  unreadCount,
};
