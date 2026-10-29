/**
 * @file sellRequest.dao.ts
 * @description Data Access Object for SellRequest model.
 * @module DAO
 * @author VehicleMarket Backend
 */

import SellRequest from '../models/SellRequest.model';
import { PaginationParams } from '../interfaces/request.interface';

export const create = async (data: Record<string, any>) => {
  const doc = await SellRequest.create(data);
  return doc.toObject();
};

export const findById = async (id: string) => SellRequest.findById(id).lean();

export const findByIdPopulated = async (id: string) =>
  SellRequest.findById(id)
    .populate('brand', 'name slug categories')
    .populate('user', 'name email phone')
    .populate('assignedTo', 'name email')
    .populate('inspector', 'name email')
    .populate('listedVehicle', 'brandName model variant slug status price')
    .lean();

export const findByUserId = async (
  userId: string,
  pagination: PaginationParams = {},
  filter: Record<string, any> = {}
) => {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;
  return SellRequest.find({ user: userId, ...filter })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const findByPhone = async (
  phone: string,
  pagination: PaginationParams = {},
  filter: Record<string, any> = {}
) => {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;
  return SellRequest.find({ phone, ...filter })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const findAll = async (
  filter: Record<string, any> = {},
  pagination: PaginationParams = {}
) => {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
  const skip = (page - 1) * limit;
  return SellRequest.find(filter)
    .populate('brand', 'name slug')
    .populate('user', 'name email phone')
    .populate('assignedTo', 'name email')
    .populate('listedVehicle', 'brandName model variant slug status price')
    .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countAll = async (filter: Record<string, any> = {}) =>
  SellRequest.countDocuments(filter);

export const updateById = async (id: string, data: Record<string, any>) =>
  SellRequest.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();

export const updateWithOps = async (id: string, ops: Record<string, any>) =>
  SellRequest.findByIdAndUpdate(id, ops, { new: true, runValidators: true }).lean();

export const countByStatus = async (status: string) => SellRequest.countDocuments({ status });

export const countPending = async () =>
  SellRequest.countDocuments({
    status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'INSPECTION_SCHEDULED', 'INSPECTED', 'OFFER_MADE', 'NEGOTIATING'] },
  });

export const findRecent = async (limit = 10) =>
  SellRequest.find().sort({ createdAt: -1 }).limit(limit).lean();

export default {
  create,
  findById,
  findByIdPopulated,
  findByUserId,
  findByPhone,
  findAll,
  countAll,
  updateById,
  updateWithOps,
  countByStatus,
  countPending,
  findRecent,
};
