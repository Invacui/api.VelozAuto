/**
 * @file sellRequest.validator.ts
 * @description Joi validation schemas for SellRequest endpoints. Guest sell
 *              requests are allowed; images come from the /uploads staging flow.
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
  SELL_REQUEST_STATUSES,
  SELLER_TYPES,
  SELL_IMAGE_TAGS,
  SELL_INSPECTION_SLOTS,
  REGISTRATION_TYPES,
  INSURANCE_TYPES,
  LOAN_STATUSES,
  ACCIDENT_HISTORY,
  TYRE_CONDITIONS,
  SELL_VEHICLE_CONDITIONS,
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
const optionalStr = (max = 255) => Joi.string().trim().max(max).optional().allow('', null);

export const sellImageSchema = Joi.object({
  url: Joi.string().uri({ allowRelative: true }).max(1000).required(),
  s3Key: optionalStr(500),
  tag: Joi.string().valid(...SELL_IMAGE_TAGS).optional(),
});

export const createSellRequestSchema = Joi.object({
  // Seller — only name, phone and email are required on the short form.
  name: Joi.string().trim().min(2).max(120).required(),
  phone: phoneSchema.required(),
  email: Joi.string().email().lowercase().trim().optional().allow('', null),
  city: Joi.string().trim().max(100).optional().allow('', null),
  pincode: pincodeSchema.optional().allow('', null),
  inspectionSlot: Joi.string().valid(...SELL_INSPECTION_SLOTS, null).optional(),
  sellerType: Joi.string().valid(...SELLER_TYPES).optional(),
  expectedPrice: Joi.number().min(0).optional(),

  // Vehicle — vital details captured up front; the rest is filled in later.
  category: Joi.string().valid(...VEHICLE_CATEGORIES).optional(),
  usageType: Joi.string().valid(...USAGE_TYPES).optional(),
  subCategory: Joi.string().valid(...COMMERCIAL_SUB_CATEGORIES, null).optional(),
  bodyType: Joi.string().valid(...BODY_TYPES, null).optional(),
  brand: objectId.optional(),
  brandName: Joi.string().trim().max(120).optional().allow('', null),
  model: Joi.string().trim().max(120).optional().allow('', null),
  variant: optionalStr(120),
  manufacturingYear: Joi.number().integer().min(1980).max(new Date().getFullYear() + 1).optional(),
  registrationYear: optionalNum(1980, new Date().getFullYear() + 1),
  color: optionalStr(40),
  fuelType: Joi.string().valid(...FUEL_TYPES, null).optional().allow('', null),
  transmission: Joi.string().valid(...TRANSMISSIONS, null).optional().allow('', null),
  bsNorm: Joi.string().valid(...BS_NORMS, null).optional(),
  engineCapacityCc: optionalNum(0, 20000),
  powerBhp: optionalNum(0, 3000),
  kmDriven: Joi.number().min(0).max(1000000).optional(),
  condition: Joi.string().valid(...SELL_VEHICLE_CONDITIONS).optional(),
  ownerCount: Joi.string().valid(...OWNER_COUNTS).optional(),
  seats: Joi.number().integer().min(1).max(100).optional(),

  registrationNumber: regNumberSchema.optional().allow('', null),
  registrationState: stateSchema.optional().allow('', null),
  rtoCode: rtoCodeSchema.optional().allow('', null),
  registrationCity: optionalStr(100),
  registrationType: Joi.string().valid(...REGISTRATION_TYPES, null).optional(),
  rcAvailable: Joi.boolean().optional(),
  insuranceType: Joi.string().valid(...INSURANCE_TYPES, null).optional().allow('', null),
  insuranceValidTill: dateSchema.optional().allow(null),
  loanStatus: Joi.string().valid(...LOAN_STATUSES, null).optional().allow('', null),
  financierName: optionalStr(200),
  accidentHistory: Joi.string().valid(...ACCIDENT_HISTORY, null).optional().allow('', null),
  floodDamage: Joi.boolean().optional(),
  serviceHistoryAvailable: Joi.boolean().optional(),
  tyreCondition: Joi.string().valid(...TYRE_CONDITIONS, null).optional().allow('', null),
  description: Joi.string().trim().max(8000).optional().allow('', null),

  grossVehicleWeightKg: optionalNum(0, 100000),
  payloadCapacityKg: optionalNum(0, 100000),
  axleConfiguration: optionalStr(30),
  numberOfTyres: optionalNum(2, 40),
  sleepingCapacity: optionalNum(0, 20),
  hasKitchenette: Joi.boolean().optional(),
  hasToilet: Joi.boolean().optional(),

  images: Joi.array().items(sellImageSchema).max(20).optional(),
});

export const updateSellRequestSchema = Joi.object({
  status: Joi.string().valid(...SELL_REQUEST_STATUSES).optional(),
  offerPrice: Joi.number().min(0).optional(),
  inspectionDate: dateSchema.optional().allow(null),
  inspector: objectId.optional().allow(null),
  rejectionReason: Joi.string().trim().max(2000).optional().allow('', null),
  assignedTo: objectId.optional().allow(null),
  internalNote: Joi.string().trim().max(2000).optional().allow('', null),
  note: Joi.string().trim().max(1000).optional().allow('', null),
})
  .or('status', 'offerPrice', 'inspectionDate', 'inspector', 'rejectionReason', 'assignedTo', 'internalNote')
  .messages({ 'object.missing': 'Provide at least one field to update' });

export const convertSellRequestSchema = Joi.object({
  override: Joi.object({
    price: Joi.number().min(1000).optional(),
    status: Joi.string().valid('DRAFT', 'ACTIVE').optional(),
    isFeatured: Joi.boolean().optional(),
    brand: objectId.optional(),
    description: Joi.string().trim().max(8000).optional().allow('', null),
    isPriceNegotiable: Joi.boolean().optional(),
    emiStartingFrom: Joi.number().min(0).optional(),
    locationState: Joi.string().trim().max(100).optional(),
    locationCity: Joi.string().trim().max(100).optional(),
    locationPincode: Joi.string().trim().max(10).optional(),
    yardName: Joi.string().trim().max(200).optional().allow('', null),
  }).optional(),
});

export const listSellRequestsQuerySchema = Joi.object({
  ...paginationSchema,
  status: Joi.string().valid(...SELL_REQUEST_STATUSES).optional(),
  assignedTo: objectId.optional(),
  category: Joi.string().valid(...VEHICLE_CATEGORIES).optional(),
  phone: Joi.string().trim().max(20).optional(),
  q: Joi.string().trim().max(200).optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

export default {
  createSellRequestSchema,
  updateSellRequestSchema,
  convertSellRequestSchema,
  listSellRequestsQuerySchema,
};
