/**
 * @file testimonial.dao.ts
 * @description Data Access Object for Testimonial model.
 * @module DAO
 * @author VehicleMarket Backend
 */

import Testimonial from '../models/Testimonial.model';
import { PaginationParams } from '../interfaces/request.interface';

export const create = async (data: Record<string, any>) =>
  (await Testimonial.create(data)).toObject();
export const findById = async (id: string) => Testimonial.findById(id).lean();
export const updateById = async (id: string, data: Record<string, any>) =>
  Testimonial.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
export const removeById = async (id: string) => Testimonial.findByIdAndDelete(id).lean();
export const findAll = async (filter: Record<string, any> = {}, pagination: PaginationParams = {}) => {
  const { page = 1, limit = 100 } = pagination;
  const skip = (page - 1) * limit;
  return Testimonial.find(filter).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean();
};
export const countAll = async (filter: Record<string, any> = {}) =>
  Testimonial.countDocuments(filter);
export default { create, findById, updateById, removeById, findAll, countAll };
