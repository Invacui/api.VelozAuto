/**
 * @file vehicle.service.ts
 * @description Vehicle service — listing search/filters, CRUD, media, status
 *              workflow, similar vehicles and filter metadata. Enforces
 *              category-conditional field requirements and slug uniqueness.
 * @module Services
 * @author VehicleMarket Backend
 */

import * as vehicleDao from '../dao/vehicle.dao';
import * as brandDao from '../dao/brand.dao';
import * as userDao from '../dao/user.dao';
import { AppError } from '../utils/AppError';
import { PaginationParams } from '../interfaces/request.interface';
import logger from '../logger/index';
import {
  toPublicVehicle,
  toStaffVehicle,
  toVehicleCard,
} from '../shared/serializers/vehicle.serializer';
import { uploadVehicleImage } from './upload.service';
import { storageService } from '../shared/lib/storage.lib';

export interface StaffActor {
  id: string;
  role: string;
}

const assertVehicleAccess = (vehicle: any, actor: StaffActor) => {
  if (actor.role === 'ADMIN') return;
  if (String(vehicle.createdBy) !== actor.id) {
    throw new AppError('You do not have access to this vehicle.', 403);
  }
};

const toPostedBy = (owner: any) =>
  owner
    ? {
        id: String(owner._id),
        name: owner.name,
        email: owner.email,
        isVendor: !!owner.isVendor,
        companyName: owner.companyName ?? null,
      }
    : null;

const attachPostedBy = async (vehicle: any) => {
  const out = toStaffVehicle(vehicle);
  out.postedBy = out?.createdBy
    ? toPostedBy(await userDao.findById(String(out.createdBy)))
    : null;
  return out;
};

const attachPostedByList = async (vehicles: any[]) => {
  const ids = [...new Set(vehicles.map((v) => String(v.createdBy || '')).filter(Boolean))];
  const owners = ids.length ? await userDao.findByIds(ids) : [];
  const ownersById = new Map(owners.map((owner) => [String(owner._id), owner]));
  return vehicles.map((vehicle) => {
    const out = toStaffVehicle(vehicle);
    out.postedBy = toPostedBy(ownersById.get(String(vehicle.createdBy || '')));
    return out;
  });
};

const REQUIRED_BY_CATEGORY: Record<string, string[]> = {
  COMMERCIAL: ['subCategory'],
  CARAVAN_MOTORHOME: ['bodyType'],
};

const slugSuffix = () => Math.random().toString(36).slice(2, 6);

/** Ensure a unique slug, appending a short suffix on collision. */
const ensureUniqueSlug = async (baseSlug: string, currentId?: string): Promise<string> => {
  let slug = baseSlug;
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await vehicleDao.findBySlug(slug);
    if (!existing || (currentId && String(existing._id) === currentId)) return slug;
    attempt += 1;
    slug = `${baseSlug}-${slugSuffix()}`;
    if (attempt > 5) return `${baseSlug}-${Date.now()}`;
  }
};

/** Validate category/usage-specific requirements and fill brandName. */
const validateAndPrepare = async (data: Record<string, any>): Promise<Record<string, any>> => {
  const out = { ...data };

  if (out.brand) {
    const brand = await brandDao.findById(out.brand);
    if (!brand) throw new AppError('Selected brand not found.', 404);
    if (!brand.isActive) throw new AppError('Selected brand is not available.', 400);
    if (brand.categories?.length && out.category && !brand.categories.includes(out.category)) {
      throw new AppError(`Brand "${brand.name}" is not available for category ${out.category}.`, 400);
    }
    out.brandName = brand.name;
  }

  if (out.category && REQUIRED_BY_CATEGORY[out.category]) {
    for (const field of REQUIRED_BY_CATEGORY[out.category]) {
      if (out[field] === undefined || out[field] === null || out[field] === '') {
        throw new AppError(
          `"${field}" is required for category ${out.category}.`,
          422
        );
      }
    }
  }

  if (out.usageType === 'COMMERCIAL' && out.category !== 'COMMERCIAL') {
    // A taxi/auto etc. of a passenger car remains PASSENGER_CAR + COMMERCIAL usage — allowed.
  }

  // Caravan/RTO modification detail requirement
  if (out.rtoModificationApproved === true && !out.rtoModificationDetails) {
    throw new AppError('rtoModificationDetails is required when RTO modification is approved.', 422);
  }

  return out;
};

// =====================
// Create / Update
// =====================

export const createVehicle = async (data: Record<string, any>, userId: string) => {
  const methodName = 'createVehicle';
  logger.info(`${methodName} - entry`, { fileName: 'vehicle.service.ts', methodName, userId });

  const prepared = await validateAndPrepare(data);

  if (!prepared.slug) {
    const parts = [
      prepared.brandName,
      prepared.model,
      prepared.variant,
      String(prepared.manufacturingYear),
      prepared.locationCity,
    ];
    const base = parts
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 140);
    prepared.slug = await ensureUniqueSlug(base);
  } else {
    prepared.slug = await ensureUniqueSlug(String(prepared.slug));
  }

  // Normalize image ordering / primary flag
  if (Array.isArray(prepared.images)) {
    prepared.images = prepared.images.map((img: any, idx: number) => ({
      ...img,
      order: img.order ?? idx,
      isPrimary: idx === 0 ? true : !!img.isPrimary,
    }));
  }

  const created = await vehicleDao.create({ ...prepared, createdBy: userId });
  logger.info(`${methodName} - exit`, { fileName: 'vehicle.service.ts', methodName, vehicleId: created._id });
  return toStaffVehicle(created);
};

export const updateVehicle = async (
  id: string,
  data: Record<string, any>,
  actor: StaffActor
) => {
  const existing = await vehicleDao.findByIdFull(id);
  if (!existing) throw new AppError('Vehicle not found.', 404);
  assertVehicleAccess(existing, actor);

  const prepared = await validateAndPrepare({ ...data });
  delete prepared.createdBy; // never reassign ownership

  if (prepared.slug && prepared.slug !== existing.slug) {
    prepared.slug = await ensureUniqueSlug(String(prepared.slug), id);
  } else {
    delete prepared.slug;
  }

  const updated = await vehicleDao.updateById(id, prepared);
  return toStaffVehicle(updated);
};

export const updateStatus = async (id: string, status: string, actor: StaffActor) => {
  const existing = await vehicleDao.findByIdFull(id);
  if (!existing) throw new AppError('Vehicle not found.', 404);
  assertVehicleAccess(existing, actor);

  if (status === 'ACTIVE') {
    if (!existing.images || existing.images.length < 1) {
      throw new AppError('A vehicle needs at least one image before it can be published (ACTIVE).', 422);
    }
  }

  const updated = await vehicleDao.updateById(id, { status });
  return toStaffVehicle(updated);
};

export const deleteVehicle = async (id: string, actor: StaffActor) => {
  const existing = await vehicleDao.findById(id);
  if (!existing) throw new AppError('Vehicle not found.', 404);
  assertVehicleAccess(existing, actor);
  await vehicleDao.softDelete(id);
  return { id, deleted: true };
};

// =====================
// Media
// =====================

export const addImages = async (
  id: string,
  files: Express.Multer.File[],
  tags: string[],
  actor: StaffActor
) => {
  const existing = await vehicleDao.findByIdFull(id);
  if (!existing) throw new AppError('Vehicle not found.', 404);
  assertVehicleAccess(existing, actor);

  const current = existing.images || [];
  if (current.length + files.length > 15) {
    throw new AppError('A vehicle can have at most 15 images.', 422);
  }

  const uploaded: any[] = [];
  for (let i = 0; i < files.length; i += 1) {
    const { url, s3Key } = await uploadVehicleImage(id, files[i]);
    uploaded.push({
      url,
      s3Key,
      order: current.length + i,
      isPrimary: current.length === 0 && i === 0,
      tag: tags[i] || 'EXTERIOR',
    });
  }

  const images = [...current.map((img: any) => ({ ...img })), ...uploaded];
  const updated = await vehicleDao.updateById(id, { images });
  return toStaffVehicle(updated);
};

/** Append images that already exist at a remote URL (no file upload). */
export const addImagesByUrl = async (
  id: string,
  entries: { url: string; tag?: string }[],
  actor: StaffActor
) => {
  const existing = await vehicleDao.findByIdFull(id);
  if (!existing) throw new AppError('Vehicle not found.', 404);
  assertVehicleAccess(existing, actor);

  const current = existing.images || [];
  if (current.length + entries.length > 15) {
    throw new AppError('A vehicle can have at most 15 images.', 422);
  }

  const added = entries.map((entry, i) => ({
    url: entry.url,
    order: current.length + i,
    isPrimary: current.length === 0 && i === 0,
    tag: entry.tag || 'EXTERIOR',
  }));

  const images = [...current.map((img: any) => ({ ...img })), ...added];
  const updated = await vehicleDao.updateById(id, { images });
  return toStaffVehicle(updated);
};

export const removeImage = async (id: string, imageId: string, actor: StaffActor) => {
  const existing = await vehicleDao.findByIdFull(id);
  if (!existing) throw new AppError('Vehicle not found.', 404);
  assertVehicleAccess(existing, actor);

  const images = (existing.images || []).filter((img: any) => String(img._id) !== imageId);
  if (images.length === (existing.images || []).length) {
    throw new AppError('Image not found on this vehicle.', 404);
  }
  // Ensure a primary image remains
  if (images.length && !images.some((img: any) => img.isPrimary)) {
    images[0].isPrimary = true;
  }
  const updated = await vehicleDao.updateById(id, { images });

  // best-effort storage cleanup
  try {
    const removed = (existing.images || []).find((img: any) => String(img._id) === imageId);
    if (removed?.s3Key) await storageService.delete(removed.s3Key);
  } catch {
    /* ignore */
  }
  return toStaffVehicle(updated);
};

// =====================
// Reads
// =====================

export const getPublicBySlug = async (slug: string, opts: { incrementView?: boolean } = {}) => {
  const vehicle = await vehicleDao.findBySlug(slug);
  if (!vehicle) throw new AppError('Vehicle not found.', 404);
  if (vehicle.status !== 'ACTIVE' && vehicle.status !== 'RESERVED' && vehicle.status !== 'SOLD') {
    throw new AppError('Vehicle not found.', 404);
  }
  if (opts.incrementView) {
    await vehicleDao.incrementViews(String(vehicle._id));
  }
  return toPublicVehicle(vehicle);
};

export const getPublicById = async (id: string) => {
  const vehicle = await vehicleDao.findById(id);
  if (!vehicle || vehicle.deletedAt) throw new AppError('Vehicle not found.', 404);
  return toPublicVehicle(vehicle);
};

export const getStaffById = async (id: string, actor: StaffActor) => {
  const vehicle = await vehicleDao.findByIdFull(id);
  if (!vehicle) throw new AppError('Vehicle not found.', 404);
  assertVehicleAccess(vehicle, actor);
  return attachPostedBy(vehicle);
};

export const getSimilar = async (id: string, limit = 6) => {
  const vehicle = await vehicleDao.findById(id);
  if (!vehicle) throw new AppError('Vehicle not found.', 404);
  const similar = await vehicleDao.findSimilar(vehicle, limit);
  return similar.map(toVehicleCard);
};

// =====================
// Search
// =====================

const buildFilter = (query: Record<string, any>, publicOnly: boolean): Record<string, any> => {
  const f: Record<string, any> = { deletedAt: null };

  if (publicOnly) {
    f.status = query.status ? query.status : { $in: ['ACTIVE', 'RESERVED'] };
  } else if (query.status) {
    f.status = query.status;
  }

  if (query.category) f.category = query.category;
  if (query.usageType) f.usageType = query.usageType;
  if (query.subCategory) f.subCategory = query.subCategory;
  if (query.bodyType) f.bodyType = query.bodyType;
  if (query.brand) f.brand = query.brand;
  if (query.brandName) f.brandName = new RegExp(`^${query.brandName}$`, 'i');
  if (query.model) f.model = new RegExp(query.model, 'i');
  if (query.fuelType) f.fuelType = query.fuelType;
  if (query.transmission) f.transmission = query.transmission;
  if (query.ownerCount) f.ownerCount = query.ownerCount;
  if (query.bsNorm) f.bsNorm = query.bsNorm;
  if (query.state) f.locationState = new RegExp(`^${query.state}$`, 'i');
  if (query.city) f.locationCity = new RegExp(`^${query.city}$`, 'i');
  if (query.featured === true) f.isFeatured = true;

  if (query.isInspected === true) f.isInspected = true;

  // Ranges
  const range = (field: string, min?: any, max?: any) => {
    if (min !== undefined || max !== undefined) {
      f[field] = {};
      if (min !== undefined) f[field].$gte = Number(min);
      if (max !== undefined) f[field].$lte = Number(max);
    }
  };
  range('manufacturingYear', query.minYear, query.maxYear);
  range('price', query.minPrice, query.maxPrice);
  range('kmDriven', query.minKm, query.maxKm);
  range('grossVehicleWeightKg', query.minGvw, query.maxGvw);

  if (query.q) {
    f.$text = { $search: query.q };
  }
  return f;
};

export const listVehicles = async (query: Record<string, any> = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const filter = buildFilter(query, true);

  if (filter.$text) {
    // text search: sort by relevance unless an explicit sort was requested
    const data = await vehicleDao.findMany(filter, { page, limit, sort: query.sort }, vehicleDao.LIST_FIELDS);
    const totalItems = await vehicleDao.countAll(filter);
    return { data: data.map(toVehicleCard), totalItems, page, limit };
  }

  const data = await vehicleDao.findMany(
    filter,
    { page, limit, sort: query.sort || 'newest' },
    vehicleDao.LIST_FIELDS
  );
  const totalItems = await vehicleDao.countAll(filter);
  return { data: data.map(toVehicleCard), totalItems, page, limit };
};

export const listAdminVehicles = async (
  query: Record<string, any> = {},
  actor: StaffActor
) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const filter = buildFilter(query, false);
  if (query.includeDeleted) delete filter.deletedAt;
  else filter.deletedAt = null;
  if (actor.role !== 'ADMIN') filter.createdBy = actor.id;

  const data = await vehicleDao.findMany(filter, { page, limit, sort: query.sort || 'newest' }, vehicleDao.LIST_FIELDS);
  const totalItems = await vehicleDao.countAll(filter);
  return { data: await attachPostedByList(data), totalItems, page, limit };
};

export const getFeatured = async (limit = 8) => {
  const data = await vehicleDao.findMany(
    { status: 'ACTIVE', isFeatured: true, deletedAt: null },
    { page: 1, limit, sort: 'newest' }
  );
  return data.map(toVehicleCard);
};

/** Distinct values used to build the filter UI. */
export const getFiltersMeta = async () => {
  const [
    categories,
    usageTypes,
    bodyTypes,
    fuelTypes,
    transmissions,
    brands,
    states,
    cities,
    subCategories,
  ] = await Promise.all([
    vehicleDao.distinctValues('category'),
    vehicleDao.distinctValues('usageType'),
    vehicleDao.distinctValues('bodyType'),
    vehicleDao.distinctValues('fuelType'),
    vehicleDao.distinctValues('transmission'),
    vehicleDao.distinctValues('brandName'),
    vehicleDao.distinctValues('locationState'),
    vehicleDao.distinctValues('locationCity'),
    vehicleDao.distinctValues('subCategory'),
  ]);
  return { categories, usageTypes, bodyTypes, fuelTypes, transmissions, brands, states, cities, subCategories };
};

export default {
  createVehicle,
  updateVehicle,
  updateStatus,
  deleteVehicle,
  addImages,
  addImagesByUrl,
  removeImage,
  getPublicBySlug,
  getPublicById,
  getStaffById,
  getSimilar,
  listVehicles,
  listAdminVehicles,
  getFeatured,
  getFiltersMeta,
};
