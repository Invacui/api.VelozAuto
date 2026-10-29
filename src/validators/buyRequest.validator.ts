/**
 * @file buyRequest.validator.ts
 * @description Joi validation schemas for BuyRequest endpoints.
 * @module Validators
 * @author VehicleMarket Backend
 */

import Joi from 'joi';
import { BUDGET_RANGES, BUY_REQUEST_STATUSES } from '../constants/vehicleEnums';
import { objectId, phoneSchema, paginationSchema, dateSchema } from './common.validator';

export const createBuyRequestSchema = Joi.object({
  vehicle: objectId.required(),
  name: Joi.string().trim().min(2).max(120).required(),
  phone: phoneSchema.required(),
  email: Joi.string().email().lowercase().trim().optional().allow('', null),
  city: Joi.string().trim().max(100).optional().allow('', null),
  budget: Joi.string().valid(...BUDGET_RANGES).optional().allow(null),
  needsFinance: Joi.boolean().optional(),
  wantsTestDrive: Joi.boolean().optional(),
  testDriveDate: dateSchema.optional().allow(null),
  hasExchangeVehicle: Joi.boolean().optional(),
  exchangeDetails: Joi.string().trim().max(2000).optional().allow('', null),
  message: Joi.string().trim().max(2000).optional().allow('', null),
});

export const updateBuyRequestSchema = Joi.object({
  status: Joi.string().valid(...BUY_REQUEST_STATUSES).optional(),
  assignedTo: objectId.optional().allow(null),
  note: Joi.string().trim().max(1000).optional().allow('', null),
  internalNote: Joi.string().trim().max(2000).optional().allow('', null),
  budget: Joi.string().valid(...BUDGET_RANGES).optional().allow(null),
  needsFinance: Joi.boolean().optional(),
  wantsTestDrive: Joi.boolean().optional(),
  testDriveDate: dateSchema.optional().allow(null),
  hasExchangeVehicle: Joi.boolean().optional(),
  exchangeDetails: Joi.string().trim().max(2000).optional().allow('', null),
})
  .or('status', 'assignedTo', 'internalNote', 'testDriveDate', 'needsFinance', 'wantsTestDrive', 'note')
  .messages({ 'object.missing': 'Provide at least one field to update' });

export const listBuyRequestsQuerySchema = Joi.object({
  ...paginationSchema,
  status: Joi.string().valid(...BUY_REQUEST_STATUSES).optional(),
  vehicle: objectId.optional(),
  assignedTo: objectId.optional(),
  user: objectId.optional(),
  phone: Joi.string().trim().max(20).optional(),
  q: Joi.string().trim().max(200).optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

export default {
  createBuyRequestSchema,
  updateBuyRequestSchema,
  listBuyRequestsQuerySchema,
};
