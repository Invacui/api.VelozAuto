/**
 * @file notification.dao.ts
 * @description Data Access Object for admin Notification model.
 * @module DAO
 * @author VehicleMarket Backend
 */

import Notification from '../models/Notification.model';
import { PaginationParams } from '../interfaces/request.interface';

export const create = async (data: Record<string, any>) =>
  (await Notification.create(data)).toObject();

export const findAll = async (
  filter: Record<string, any> = {},
  pagination: PaginationParams = {}
) => {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;
  return Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
};

export const countAll = async (filter: Record<string, any> = {}) =>
  Notification.countDocuments(filter);

export const countUnread = async () => Notification.countDocuments({ isRead: false });

export const markRead = async (id: string) =>
  Notification.findByIdAndUpdate(id, { $set: { isRead: true } }, { new: true }).lean();

export const markAllRead = async () =>
  Notification.updateMany({ isRead: false }, { $set: { isRead: true } });

export default { create, findAll, countAll, countUnread, markRead, markAllRead };
