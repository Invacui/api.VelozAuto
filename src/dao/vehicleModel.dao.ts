/**
 * @file vehicleModel.dao.ts
 * @description Data Access Object for VehicleModel master model.
 * @module DAO
 * @author VehicleMarket Backend
 */

import VehicleModel from '../models/VehicleModel.model';
import { PaginationParams } from '../interfaces/request.interface';

export const create = async (data: Record<string, any>) =>
  (await VehicleModel.create(data)).toObject();
export const findById = async (id: string) => VehicleModel.findById(id).lean();
export const findByBrandSlug = async (brand: string, slug: string) =>
  VehicleModel.findOne({ brand, slug }).lean();
export const updateById = async (id: string, data: Record<string, any>) =>
  VehicleModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
export const removeById = async (id: string) => VehicleModel.findByIdAndDelete(id).lean();

export const findAll = async (
  filter: Record<string, any> = {},
  pagination: PaginationParams = {}
) => {
  const { page = 1, limit = 200 } = pagination;
  const skip = (page - 1) * limit;
  return VehicleModel.find(filter)
    .populate('brand', 'name slug')
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countAll = async (filter: Record<string, any> = {}) =>
  VehicleModel.countDocuments(filter);

export default { create, findById, findByBrandSlug, updateById, removeById, findAll, countAll };
