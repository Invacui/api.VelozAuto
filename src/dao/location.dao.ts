/**
 * @file location.dao.ts
 * @description Data Access Object for Location master model.
 * @module DAO
 * @author VehicleMarket Backend
 */

import Location from '../models/Location.model';
import { PaginationParams } from '../interfaces/request.interface';

export const create = async (data: Record<string, any>) => (await Location.create(data)).toObject();
export const findById = async (id: string) => Location.findById(id).lean();
export const findByState = async (state: string) => Location.findOne({ state }).lean();
export const updateById = async (id: string, data: Record<string, any>) =>
  Location.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
export const removeById = async (id: string) => Location.findByIdAndDelete(id).lean();

export const findAll = async (
  filter: Record<string, any> = {},
  pagination: PaginationParams = {}
) => {
  const { page = 1, limit = 200 } = pagination;
  const skip = (page - 1) * limit;
  return Location.find(filter).sort({ state: 1 }).skip(skip).limit(limit).lean();
};

export const countAll = async (filter: Record<string, any> = {}) =>
  Location.countDocuments(filter);

export default { create, findById, findByState, updateById, removeById, findAll, countAll };
