/**
 * @file banner.dao.ts
 * @description Data Access Object for Banner model.
 * @module DAO
 * @author VehicleMarket Backend
 */

import Banner from '../models/Banner.model';
import { PaginationParams } from '../interfaces/request.interface';

export const create = async (data: Record<string, any>) => (await Banner.create(data)).toObject();
export const findById = async (id: string) => Banner.findById(id).lean();
export const updateById = async (id: string, data: Record<string, any>) =>
  Banner.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
export const removeById = async (id: string) => Banner.findByIdAndDelete(id).lean();
export const findAll = async (filter: Record<string, any> = {}, pagination: PaginationParams = {}) => {
  const { page = 1, limit = 100 } = pagination;
  const skip = (page - 1) * limit;
  return Banner.find(filter).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean();
};
export const countAll = async (filter: Record<string, any> = {}) => Banner.countDocuments(filter);
export default { create, findById, updateById, removeById, findAll, countAll };
