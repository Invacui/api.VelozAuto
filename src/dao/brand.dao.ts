/**
 * @file brand.dao.ts
 * @description Data Access Object for Brand model.
 * @module DAO
 * @author VehicleMarket Backend
 */

import Brand from '../models/Brand.model';
import { PaginationParams } from '../interfaces/request.interface';

export const create = async (data: Record<string, any>) => (await Brand.create(data)).toObject();
export const findById = async (id: string) => Brand.findById(id).lean();
export const findBySlug = async (slug: string) => Brand.findOne({ slug }).lean();
export const findByName = async (name: string) => Brand.findOne({ name }).lean();
export const updateById = async (id: string, data: Record<string, any>) =>
  Brand.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
export const removeById = async (id: string) => Brand.findByIdAndDelete(id).lean();

export const findAll = async (
  filter: Record<string, any> = {},
  pagination: PaginationParams = {}
) => {
  const { page = 1, limit = 200 } = pagination;
  const skip = (page - 1) * limit;
  return Brand.find(filter).sort({ sortOrder: 1, name: 1 }).skip(skip).limit(limit).lean();
};

export const countAll = async (filter: Record<string, any> = {}) => Brand.countDocuments(filter);

export default { create, findById, findBySlug, findByName, updateById, removeById, findAll, countAll };
