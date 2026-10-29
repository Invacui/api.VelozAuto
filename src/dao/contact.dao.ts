/**
 * @file contact.dao.ts
 * @description Data Access Object for Contact model.
 * @module DAO
 * @author VehicleMarket Backend
 */

import Contact from '../models/Contact.model';
import { PaginationParams } from '../interfaces/request.interface';

export const create = async (data: Record<string, any>) => (await Contact.create(data)).toObject();
export const findById = async (id: string) => Contact.findById(id).lean();
export const updateById = async (id: string, data: Record<string, any>) =>
  Contact.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
export const findAll = async (filter: Record<string, any> = {}, pagination: PaginationParams = {}) => {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;
  return Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
};
export const countAll = async (filter: Record<string, any> = {}) => Contact.countDocuments(filter);
export default { create, findById, updateById, findAll, countAll };
