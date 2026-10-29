/**
 * @file vehicle.validator.ts
 * @description Joi validation schemas for Vehicle endpoints. Body validation
 *              rejects unknown fields; category-conditional requirements are
 *              enforced in the service layer.
 * @module Validators
 * @author VehicleMarket Backend
 */

import Joi from 'joi';
import {
  VEHICLE_CATEGORIES,
  USAGE_TYPES,
  COMMERCIAL_SUB_CATEGORIES,
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSIONS,
  BS_NORMS,
  OWNER_COUNTS,
  VEHICLE_STATUSES,
  IMAGE_TAGS,
  REGISTRATION_TYPES,
  RC_TYPES,
  OWNERSHIP_TRANSFER_STATUS,
  ROAD_TAX_STATUSES,
  PERMIT_TYPES,
  ACCIDENT_HISTORY,
  TYRE_CONDITIONS,
  WARRANTY_TYPES,
  AXLE_CONFIGURATIONS,
  CABIN_TYPES,
  SELLER_TYPES,
} from '../constants/vehicleEnums';
import {
  objectId,
  phoneSchema,
  pincodeSchema,
  regNumberSchema,
  stateSchema,
  rtoCodeSchema,
  paginationSchema,
  dateSchema,
} from './common.validator';

const optionalNum = (min: number, max: number) => Joi.number().min(min).max(max).optional();
const optionalBool = Joi.boolean().optional();
const optionalStr = (max = 255) => Joi.string().trim().max(max).optional().allow('', null);

export const imageSchema = Joi.object({
  url: Joi.string().uri({ allowRelative: true }).max(1000).required(),
  s3Key: optionalStr(500),
  order: Joi.number().integer().min(0).optional(),
  isPrimary: Joi.boolean().optional(),
  tag: Joi.string().valid(...IMAGE_TAGS, null).optional(),
});

/** Body for POST /vehicles/:id/images/urls - add images from remote URLs. */
export const addImagesByUrlSchema = Joi.object({
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri({ allowRelative: true }).max(1000).required(),
        tag: Joi.string().valid(...IMAGE_TAGS, null).optional(),
      })
    )
    .min(1)
    .max(15)
    .required(),
});

const warrantySchema = Joi.object({
  months: optionalNum(0, 120),
  km: optionalNum(0, 500000),
  type: Joi.string().valid(...WARRANTY_TYPES).optional(),
});

/** Fields accepted on create. */
export const createVehicleSchema = Joi.object({
  category: Joi.string().valid(...VEHICLE_CATEGORIES).required(),
  usageType: Joi.string().valid(...USAGE_TYPES).required(),
  subCategory: Joi.string().valid(...COMMERCIAL_SUB_CATEGORIES, null).optional(),
  bodyType: Joi.string().valid(...BODY_TYPES, null).optional(),

  brand: objectId.required(),
  brandName: Joi.string().trim().max(120).optional(), // derived from brand when omitted
  model: Joi.string().trim().max(120).required(),
  variant: optionalStr(120),
  manufacturingYear: Joi.number().integer().min(1980).max(new Date().getFullYear() + 1).required(),
  color: optionalStr(40),

  fuelType: Joi.string().valid(...FUEL_TYPES).required(),
  transmission: Joi.string().valid(...TRANSMISSIONS).required(),
  bsNorm: Joi.string().valid(...BS_NORMS, null).optional(),
  engineCapacityCc: optionalNum(0, 20000),
  powerBhp: optionalNum(0, 3000),
  torqueNm: optionalNum(0, 10000),
  mileageKmpl: optionalNum(0, 200),
  batteryCapacityKwh: optionalNum(0, 500),
  rangeKm: optionalNum(0, 3000),

  kmDriven: Joi.number().min(0).max(1000000).required(),
  ownerCount: Joi.string().valid(...OWNER_COUNTS).required(),
  seats: Joi.number().integer().min(1).max(100).optional(),
  numberOfKeys: Joi.number().integer().min(0).max(5).optional(),

  price: Joi.number().min(1000).required(),
  isPriceNegotiable: optionalBool,
  emiStartingFrom: optionalNum(0, 10000000),

  description: Joi.string().trim().max(8000).optional().allow('', null),
  features: Joi.array().items(Joi.string().trim().max(120)).max(120).optional(),
  highlights: Joi.array().items(Joi.string().trim().max(200)).max(30).optional(),
  images: Joi.array().items(imageSchema).max(15).optional(),
  videoUrl: Joi.string().uri({ allowRelative: true }).max(1000).optional().allow('', null),

  status: Joi.string().valid(...VEHICLE_STATUSES).optional(),
  isFeatured: optionalBool,
  slug: optionalStr(200),

  registrationNumber: regNumberSchema.optional().allow('', null),
  registrationState: stateSchema.required(),
  rtoCode: rtoCodeSchema.optional().allow('', null),
  registrationCity: optionalStr(100),
  registrationType: Joi.string().valid(...REGISTRATION_TYPES, null).optional(),
  rcAvailable: optionalBool,
  rcType: Joi.string().valid(...RC_TYPES, null).optional(),
  ownershipTransferStatus: Joi.string().valid(...OWNERSHIP_TRANSFER_STATUS, null).optional(),
  roadTax: Joi.string().valid(...ROAD_TAX_STATUSES).required(),
  roadTaxValidTill: dateSchema.optional(),
  permitType: Joi.string().valid(...PERMIT_TYPES, null).optional(),
  fastagInstalled: optionalBool,
  chassisNumber: optionalStr(50),
  engineNumber: optionalStr(50),

  accidentHistory: Joi.string().valid(...ACCIDENT_HISTORY).required(),
  floodDamage: optionalBool,
  serviceHistoryAvailable: optionalBool,
  lastServiceDate: dateSchema.optional(),
  tyreCondition: Joi.string().valid(...TYRE_CONDITIONS).required(),
  modifications: Joi.string().trim().max(2000).optional().allow('', null),
  isInspected: optionalBool,
  inspectionScore: optionalNum(1, 10),
  inspectionReportUrl: optionalStr(1000),
  warranty: warrantySchema.optional(),

  grossVehicleWeightKg: optionalNum(0, 100000),
  payloadCapacityKg: optionalNum(0, 100000),
  unladenWeightKg: optionalNum(0, 100000),
  axleConfiguration: Joi.string().valid(...AXLE_CONFIGURATIONS, null).optional(),
  numberOfTyres: optionalNum(2, 40),
  wheelbaseMm: optionalNum(0, 10000),
  bodyLengthFt: optionalNum(0, 100),
  cabinType: Joi.string().valid(...CABIN_TYPES, null).optional(),
  tankCapacityLitres: optionalNum(0, 1000),
  seatingCapacity: optionalNum(1, 100),
  tipperCapacityCubicM: optionalNum(0, 50),
  hasAc: optionalBool,
  hasGpsTelematics: optionalBool,

  sleepingCapacity: optionalNum(0, 20),
  hasKitchenette: optionalBool,
  hasToilet: optionalBool,
  hasGenerator: optionalBool,
  waterTankLitres: optionalNum(0, 1000),
  solarPanel: optionalBool,
  awning: optionalBool,
  buildType: optionalStr(200),
  rtoModificationApproved: optionalBool,
  rtoModificationDetails: Joi.string().trim().max(1000).optional().allow('', null),
  lengthFt: optionalNum(0, 100),
  widthFt: optionalNum(0, 50),
  heightFt: optionalNum(0, 50),

  locationState: stateSchema.required(),
  locationCity: Joi.string().trim().max(100).required(),
  locationPincode: pincodeSchema.required(),
  yardName: optionalStr(200),
  sellerType: Joi.string().valid(...SELLER_TYPES).optional(),
});

/** Update = all fields optional, at least one. */
export const updateVehicleSchema = createVehicleSchema
  .fork(
    [
      'category',
      'usageType',
      'brand',
      'model',
      'manufacturingYear',
      'fuelType',
      'transmission',
      'kmDriven',
      'ownerCount',
      'price',
      'registrationState',
      'roadTax',
      'accidentHistory',
      'tyreCondition',
      'locationState',
      'locationCity',
      'locationPincode',
    ],
    (schema) => schema.optional()
  )
  .min(1);

export const updateVehicleStatusSchema = Joi.object({
  status: Joi.string().valid(...VEHICLE_STATUSES).required(),
});

export const listVehiclesQuerySchema = Joi.object({
  ...paginationSchema,
  q: Joi.string().trim().max(200).optional(),
  category: Joi.string().valid(...VEHICLE_CATEGORIES).optional(),
  usageType: Joi.string().valid(...USAGE_TYPES).optional(),
  subCategory: Joi.string().valid(...COMMERCIAL_SUB_CATEGORIES).optional(),
  bodyType: Joi.string().valid(...BODY_TYPES).optional(),
  brand: objectId.optional(),
  brandName: Joi.string().trim().max(120).optional(),
  model: Joi.string().trim().max(120).optional(),
  minYear: Joi.number().integer().min(1980).optional(),
  maxYear: Joi.number().integer().min(1980).max(new Date().getFullYear() + 1).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  minKm: Joi.number().min(0).optional(),
  maxKm: Joi.number().min(0).optional(),
  fuelType: Joi.string().valid(...FUEL_TYPES).optional(),
  transmission: Joi.string().valid(...TRANSMISSIONS).optional(),
  ownerCount: Joi.string().valid(...OWNER_COUNTS).optional(),
  bsNorm: Joi.string().valid(...BS_NORMS).optional(),
  state: Joi.string().trim().max(100).optional(),
  city: Joi.string().trim().max(100).optional(),
  minGvw: Joi.number().min(0).optional(),
  maxGvw: Joi.number().min(0).optional(),
  isInspected: Joi.boolean().optional(),
  featured: Joi.boolean().optional(),
  status: Joi.string().valid(...VEHICLE_STATUSES).optional(),
  sort: Joi.string()
    .valid('newest', 'oldest', 'price_asc', 'price_desc', 'km_asc', 'km_desc', 'year_desc', 'year_asc', 'popular')
    .default('newest'),
});

export const adminListVehiclesQuerySchema = listVehiclesQuerySchema.keys({
  status: Joi.string().valid(...VEHICLE_STATUSES).optional(),
  includeDeleted: Joi.boolean().optional(),
});

export const similarVehiclesQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(12).default(6),
});

export default {
  createVehicleSchema,
  updateVehicleSchema,
  updateVehicleStatusSchema,
  listVehiclesQuerySchema,
  adminListVehiclesQuerySchema,
  similarVehiclesQuerySchema,
  imageSchema,
};
