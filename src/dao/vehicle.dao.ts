/**
 * @file vehicle.dao.ts
 * @description Data Access Object for Vehicle model. Builds filter/sort/geo
 *              queries for the public listing search and admin tables.
 * @module DAO
 * @author VehicleMarket Backend
 */

import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.model';
import { PaginationParams } from '../interfaces/request.interface';

export const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  km_asc: { kmDriven: 1 },
  km_desc: { kmDriven: -1 },
  year_desc: { manufacturingYear: -1 },
  year_asc: { manufacturingYear: 1 },
  popular: { views: -1 },
};

export const create = async (data: Record<string, any>) => {
  const doc = await Vehicle.create(data);
  return doc.toObject();
};

/** Minimal projection for list cards. */
export const LIST_FIELDS =
  'category usageType subCategory bodyType brandName model variant manufacturingYear ' +
  'fuelType transmission kmDriven ownerCount price isPriceNegotiable emiStartingFrom ' +
  'images slug status isFeatured views isInspected registrationState locationCity locationState ' +
  'bsNorm createdAt';

export const findById = async (id: string) => Vehicle.findById(id).lean();

export const findBySlug = async (slug: string) =>
  Vehicle.findOne({ slug, deletedAt: null }).lean();

/** Full document incl. select:false legal fields — for staff views. */
export const findByIdFull = async (id: string) =>
  Vehicle.findById(id).select('+chassisNumber +engineNumber').lean();

export const findByIdFullBySlug = async (slug: string) =>
  Vehicle.findOne({ slug, deletedAt: null }).select('+chassisNumber +engineNumber').lean();

export const incrementViews = async (id: string) =>
  Vehicle.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).lean();

export const updateById = async (id: string, data: Record<string, any>) =>
  Vehicle.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();

export const softDelete = async (id: string) =>
  Vehicle.findByIdAndUpdate(
    id,
    { $set: { deletedAt: new Date(), status: 'INACTIVE' } },
    { new: true }
  ).lean();

export const findMany = async (
  filter: Record<string, any> = {},
  pagination: PaginationParams & { sort?: string } = {},
  fields: string = LIST_FIELDS
) => {
  const { page = 1, limit = 20, sort = 'newest', sortBy, sortOrder } = pagination;
  const skip = (page - 1) * limit;
  const sortSpec =
    SORT_MAP[sort] ||
    (sortBy ? { [sortBy]: sortOrder === 'asc' ? 1 : -1 } : { createdAt: -1 });
  return Vehicle.find(filter)
    .select(fields)
    .sort(sortSpec as any)
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countAll = async (filter: Record<string, any> = {}) =>
  Vehicle.countDocuments(filter);

export const findSimilar = async (
  vehicle: Record<string, any>,
  limit = 6
) => {
  const filter: Record<string, any> = {
    _id: { $ne: vehicle._id },
    deletedAt: null,
    status: 'ACTIVE',
    category: vehicle.category,
  };
  // Prefer same body type, fall back to same category.
  const or: Record<string, any>[] = [{ bodyType: vehicle.bodyType }];
  if (vehicle.brand) or.push({ brand: vehicle.brand });
  filter.$or = or;
  return Vehicle.find(filter)
    .select(LIST_FIELDS)
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(limit)
    .lean();
};

export const distinctValues = async (field: string, filter: Record<string, any> = {}) =>
  Vehicle.distinct(field, { deletedAt: null, status: 'ACTIVE', ...filter });

export const aggregateStats = async () => {
  const [byStatus, byCategory, totals] = await Promise.all([
    Vehicle.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Vehicle.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
    Vehicle.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalViews: { $sum: '$views' },
          avgPrice: { $avg: '$price' },
        },
      },
    ]),
  ]);
  return { byStatus, byCategory, totals: totals[0] || { total: 0, totalViews: 0, avgPrice: 0 } };
};

export const countByStatus = async (status: string) =>
  Vehicle.countDocuments({ status, deletedAt: null });

export const exists = async (filter: Record<string, any>) =>
  (await Vehicle.exists(filter)) !== null;

export const findForSitemap = async (limit = 5000) =>
  Vehicle.find({ status: 'ACTIVE', deletedAt: null })
    .select('slug updatedAt')
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();

export default {
  SORT_MAP,
  LIST_FIELDS,
  create,
  findById,
  findBySlug,
  findByIdFull,
  findByIdFullBySlug,
  incrementViews,
  updateById,
  softDelete,
  findMany,
  countAll,
  findSimilar,
  distinctValues,
  aggregateStats,
  countByStatus,
  exists,
  findForSitemap,
};
