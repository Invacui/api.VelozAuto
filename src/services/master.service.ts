/**
 * @file master.service.ts
 * @description Master data service — brands, models, locations and features
 *              with public catalogue reads and admin CRUD.
 * @module Services
 * @author VehicleMarket Backend
 */

import * as brandDao from '../dao/brand.dao';
import * as vehicleModelDao from '../dao/vehicleModel.dao';
import * as locationDao from '../dao/location.dao';
import * as featureDao from '../dao/feature.dao';
import { AppError } from '../utils/AppError';
import { PaginationParams } from '../interfaces/request.interface';

const slugify = (v: string) =>
  String(v).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// =====================
// Brands
// =====================

export const listBrands = async (filter: Record<string, any> = {}, pagination: PaginationParams = {}) => {
  const { all, category, ...rest } = filter;
  const f: Record<string, any> = all ? { ...rest } : { isActive: true, ...rest };
  if (category) f.categories = category;
  const data = await brandDao.findAll(f, pagination);
  const totalItems = await brandDao.countAll(f);
  return { data, totalItems };
};

export const createBrand = async (data: Record<string, any>) => {
  const slug = data.slug || slugify(data.name);
  if (await brandDao.findBySlug(slug)) throw new AppError('A brand with this name already exists.', 409);
  return brandDao.create({ ...data, slug });
};

export const updateBrand = async (id: string, data: Record<string, any>) => {
  const existing = await brandDao.findById(id);
  if (!existing) throw new AppError('Brand not found.', 404);
  const patch = { ...data };
  if (patch.name && !patch.slug) patch.slug = slugify(patch.name);
  return brandDao.updateById(id, patch);
};

export const deleteBrand = async (id: string) => {
  const existing = await brandDao.findById(id);
  if (!existing) throw new AppError('Brand not found.', 404);
  await brandDao.removeById(id);
  return { id, deleted: true };
};

// =====================
// Models
// =====================

export const listModels = async (filter: Record<string, any> = {}, pagination: PaginationParams = {}) => {
  const data = await vehicleModelDao.findAll(filter, pagination);
  const totalItems = await vehicleModelDao.countAll(filter);
  return { data, totalItems };
};

export const createModel = async (data: Record<string, any>) => {
  const brand = await brandDao.findById(data.brand);
  if (!brand) throw new AppError('Brand not found.', 404);
  const slug = data.slug || slugify(data.name);
  if (await vehicleModelDao.findByBrandSlug(data.brand, slug)) {
    throw new AppError('This model already exists for the selected brand.', 409);
  }
  return vehicleModelDao.create({ ...data, slug });
};

export const updateModel = async (id: string, data: Record<string, any>) => {
  const existing = await vehicleModelDao.findById(id);
  if (!existing) throw new AppError('Vehicle model not found.', 404);
  const patch = { ...data };
  if (patch.name && !patch.slug) patch.slug = slugify(patch.name);
  return vehicleModelDao.updateById(id, patch);
};

export const deleteModel = async (id: string) => {
  const existing = await vehicleModelDao.findById(id);
  if (!existing) throw new AppError('Vehicle model not found.', 404);
  await vehicleModelDao.removeById(id);
  return { id, deleted: true };
};

// =====================
// Locations
// =====================

export const listLocations = async (filter: Record<string, any> = {}, pagination: PaginationParams = {}) => {
  const data = await locationDao.findAll(filter, pagination);
  const totalItems = await locationDao.countAll(filter);
  return { data, totalItems };
};

export const createLocation = async (data: Record<string, any>) => {
  if (await locationDao.findByState(data.state)) {
    throw new AppError('A location record for this state already exists.', 409);
  }
  return locationDao.create(data);
};

export const updateLocation = async (id: string, data: Record<string, any>) => {
  const existing = await locationDao.findById(id);
  if (!existing) throw new AppError('Location not found.', 404);
  return locationDao.updateById(id, data);
};

export const deleteLocation = async (id: string) => {
  const existing = await locationDao.findById(id);
  if (!existing) throw new AppError('Location not found.', 404);
  await locationDao.removeById(id);
  return { id, deleted: true };
};

// =====================
// Features
// =====================

export const listFeatures = async (filter: Record<string, any> = {}, pagination: PaginationParams = {}) => {
  const data = await featureDao.findAll(filter, pagination);
  const totalItems = await featureDao.countAll(filter);
  return { data, totalItems };
};

export const createFeature = async (data: Record<string, any>) => {
  if (await featureDao.findByName(data.name)) {
    throw new AppError('A feature with this name already exists.', 409);
  }
  return featureDao.create({ ...data, slug: data.slug || slugify(data.name) });
};

export const updateFeature = async (id: string, data: Record<string, any>) => {
  const existing = await featureDao.findById(id);
  if (!existing) throw new AppError('Feature not found.', 404);
  return featureDao.updateById(id, data);
};

export const deleteFeature = async (id: string) => {
  const existing = await featureDao.findById(id);
  if (!existing) throw new AppError('Feature not found.', 404);
  await featureDao.removeById(id);
  return { id, deleted: true };
};

export default {
  listBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  listModels,
  createModel,
  updateModel,
  deleteModel,
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  listFeatures,
  createFeature,
  updateFeature,
  deleteFeature,
};
