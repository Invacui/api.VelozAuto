/**
 * @file buyRequest.dao.ts
 * @description Data Access Object for BuyRequest model.
 * @module DAO
 * @author VehicleMarket Backend
 */

import BuyRequest from '../models/BuyRequest.model';
import { PaginationParams } from '../interfaces/request.interface';

export const create = async (data: Record<string, any>) => {
  const doc = await BuyRequest.create(data);
  return doc.toObject();
};

export const findById = async (id: string) => BuyRequest.findById(id).lean();

export const findByIdPopulated = async (id: string) =>
  BuyRequest.findById(id)
    .populate('vehicle', 'brandName model variant manufacturingYear price images slug locationCity')
    .populate('user', 'name email phone')
    .populate('assignedTo', 'name email')
    .lean();

export const findRecentDuplicate = async (
  phone: string,
  vehicleId: string,
  windowMs: number
) => {
  const since = new Date(Date.now() - windowMs);
  return BuyRequest.findOne({ phone, vehicle: vehicleId, createdAt: { $gte: since } }).lean();
};

export const findByUserId = async (
  userId: string,
  pagination: PaginationParams = {},
  filter: Record<string, any> = {}
) => {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;
  return BuyRequest.find({ user: userId, ...filter })
    .populate('vehicle', 'brandName model variant manufacturingYear price images slug locationCity')
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
  return BuyRequest.find(filter)
    .populate('vehicle', 'brandName model variant manufacturingYear price images slug locationCity')
    .populate('user', 'name email phone')
    .populate('assignedTo', 'name email')
    .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countAll = async (filter: Record<string, any> = {}) =>
  BuyRequest.countDocuments(filter);

export const updateById = async (id: string, data: Record<string, any>) =>
  BuyRequest.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();

export const updateWithOps = async (id: string, ops: Record<string, any>) =>
  BuyRequest.findByIdAndUpdate(id, ops, { new: true, runValidators: true }).lean();

export const countByStatus = async (status: string) => BuyRequest.countDocuments({ status });

export const findRecent = async (limit = 10) =>
  BuyRequest.find()
    .populate('vehicle', 'brandName model variant slug')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

export default {
  create,
  findById,
  findByIdPopulated,
  findRecentDuplicate,
  findByUserId,
  findAll,
  countAll,
  updateById,
  updateWithOps,
  countByStatus,
  findRecent,
};
