/**
 * @file master.validator.ts
 * @description Joi validation schemas for master data (brands, models,
 *              locations, features).
 * @module Validators
 * @author VehicleMarket Backend
 */

import Joi from 'joi';
import {
  VEHICLE_CATEGORIES,
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSIONS,
  FEATURE_CATEGORIES,
} from '../constants/vehicleEnums';
import { objectId, paginationSchema } from './common.validator';
import { STATE_VALIDATORS } from '../constants/india';

const optionalStr = (max = 255) => Joi.string().trim().max(max).optional().allow('', null);

// ---- Brands ----
export const createBrandSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  slug: optionalStr(160),
  categories: Joi.array().items(Joi.string().valid(...VEHICLE_CATEGORIES)).min(1).required(),
  logo: optionalStr(500),
  country: Joi.string().trim().max(80).optional(),
  isActive: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().optional(),
});

export const updateBrandSchema = createBrandSchema.fork(
  ['name', 'categories'],
  (s) => s.optional()
).min(1);

// ---- Models ----
export const createModelSchema = Joi.object({
  brand: objectId.required(),
  name: Joi.string().trim().min(1).max(120).required(),
  slug: optionalStr(160),
  category: Joi.string().valid(...VEHICLE_CATEGORIES).required(),
  bodyTypes: Joi.array().items(Joi.string().valid(...BODY_TYPES)).optional(),
  fuelOptions: Joi.array().items(Joi.string().valid(...FUEL_TYPES)).optional(),
  transmissionOptions: Joi.array().items(Joi.string().valid(...TRANSMISSIONS)).optional(),
  priceRange: Joi.object({
    min: Joi.number().min(0).optional(),
    max: Joi.number().min(0).optional(),
  }).optional(),
  isActive: Joi.boolean().optional(),
});

export const updateModelSchema = createModelSchema.fork(
  ['brand', 'name', 'category'],
  (s) => s.optional()
).min(1);

// ---- Locations ----
export const createLocationSchema = Joi.object({
  state: Joi.string().valid(...STATE_VALIDATORS).required(),
  stateCode: Joi.string().trim().uppercase().max(3).required(),
  cities: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().min(1).max(120).required(),
        rtoCodes: Joi.array().items(Joi.string().uppercase().pattern(/^[A-Z]{2}[0-9]{1,2}$/)).optional(),
      })
    )
    .optional(),
  isActive: Joi.boolean().optional(),
});

export const updateLocationSchema = createLocationSchema.fork(
  ['state', 'stateCode'],
  (s) => s.optional()
).min(1);

// ---- Features ----
export const createFeatureSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  slug: optionalStr(160),
  category: Joi.string().valid(...FEATURE_CATEGORIES).optional(),
  applicableCategories: Joi.array().items(Joi.string().valid(...VEHICLE_CATEGORIES)).optional(),
  isActive: Joi.boolean().optional(),
});

export const updateFeatureSchema = createFeatureSchema.fork(['name'], (s) => s.optional()).min(1);

// ---- List queries ----
export const listMasterQuerySchema = Joi.object({
  ...paginationSchema,
  category: Joi.string().valid(...VEHICLE_CATEGORIES).optional(),
  brandId: objectId.optional(),
  isActive: Joi.boolean().optional(),
  all: Joi.boolean().optional(),
  q: Joi.string().trim().max(120).optional(),
});

export default {
  createBrandSchema,
  updateBrandSchema,
  createModelSchema,
  updateModelSchema,
  createLocationSchema,
  updateLocationSchema,
  createFeatureSchema,
  updateFeatureSchema,
  listMasterQuerySchema,
};
