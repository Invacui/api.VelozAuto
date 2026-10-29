/**
 * @file seoSetting.dao.ts
 * @description Data Access Object for per-page SEO settings.
 * @module DAO
 * @author VehicleMarket Backend
 */

import SeoSetting from '../models/SeoSetting.model';
import { PaginationParams } from '../interfaces/request.interface';

export const upsertByPath = async (path: string, data: Record<string, any>) =>
  SeoSetting.findOneAndUpdate(
    { path: path.toLowerCase().trim() },
    { $set: { ...data, path: path.toLowerCase().trim(), lastmod: new Date() } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

export const findByPath = async (path: string) =>
  SeoSetting.findOne({ path: path.toLowerCase().trim() }).lean();

export const findById = async (id: string) => SeoSetting.findById(id).lean();

export const removeById = async (id: string) => SeoSetting.findByIdAndDelete(id).lean();

export const findAll = async (
  filter: Record<string, any> = {},
  pagination: PaginationParams = {}
) => {
  const { page = 1, limit = 100 } = pagination;
  const skip = (page - 1) * limit;
  return SeoSetting.find(filter).sort({ path: 1 }).skip(skip).limit(limit).lean();
};

export const countAll = async (filter: Record<string, any> = {}) =>
  SeoSetting.countDocuments(filter);

export default { upsertByPath, findByPath, findById, removeById, findAll, countAll };
