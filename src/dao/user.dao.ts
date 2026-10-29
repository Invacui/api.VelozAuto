/**
 * @file user.dao.ts
 * @description Data Access Object for User model.
 * @module DAO
 * @author VehicleMarket Backend
 */

import User from '../models/User.model';
import { PaginationParams } from '../interfaces/request.interface';

export const create = async (data: Record<string, any>) => {
  const doc = await User.create(data);
  return doc.toObject();
};

export const findById = async (id: string) => User.findById(id).lean();

export const findByEmail = async (email: string) =>
  User.findOne({ email: email.toLowerCase().trim(), deletedAt: null }).lean();

export const findByEmailWithPassword = async (email: string) =>
  User.findOne({ email: email.toLowerCase().trim(), deletedAt: null })
    .select('+passwordHash')
    .lean();

export const findByPhone = async (phone: string) =>
  User.findOne({ phone, deletedAt: null }).lean();

export const updateById = async (id: string, data: Record<string, any>) =>
  User.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();

export const findAll = async (
  filter: Record<string, any> = {},
  pagination: PaginationParams = {}
) => {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
  const skip = (page - 1) * limit;
  return User.find({ deletedAt: null, ...filter })
    .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countAll = async (filter: Record<string, any> = {}) =>
  User.countDocuments({ deletedAt: null, ...filter });

export const softDelete = async (id: string) =>
  User.findByIdAndUpdate(id, { $set: { deletedAt: new Date(), isActive: false } }, { new: true }).lean();

export const countAdmins = async () => User.countDocuments({ role: 'ADMIN', deletedAt: null }).lean();

export default {
  create,
  findById,
  findByEmail,
  findByEmailWithPassword,
  findByPhone,
  updateById,
  findAll,
  countAll,
  softDelete,
  countAdmins,
};
