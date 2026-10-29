/**
 * @file feature.dao.ts
 * @description Data Access Object for Feature master model.
 * @module DAO
 * @author VehicleMarket Backend
 */

import Feature from '../models/Feature.model';
import { PaginationParams } from '../interfaces/request.interface';

export const create = async (data: Record<string, any>) => (await Feature.create(data)).toObject();
export const findById = async (id: string) => Feature.findById(id).lean();
export const findByName = async (name: string) => Feature.findOne({ name }).lean();
export const updateById = async (id: string, data: Record<string, any>) =>
  Feature.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
export const removeById = async (id: string) => Feature.findByIdAndDelete(id).lean();

export const findAll = async (
  filter: Record<string, any> = {},
  pagination: PaginationParams = {}
) => {
  const { page = 1, limit = 300 } = pagination;
  const skip = (page - 1) * limit;
  return Feature.find(filter).sort({ category: 1, name: 1 }).skip(skip).limit(limit).lean();
};

export const countAll = async (filter: Record<string, any> = {}) => Feature.countDocuments(filter);

export default { create, findById, findByName, updateById, removeById, findAll, countAll };
