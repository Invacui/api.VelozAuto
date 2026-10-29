/**
 * @file admin.validator.ts
 * @description Joi validation schemas for admin endpoints (users, dashboard).
 * @module Validators
 * @author VehicleMarket Backend
 */

import Joi from 'joi';
import { objectId, paginationSchema } from './common.validator';

export const listUsersQuerySchema = Joi.object({
  ...paginationSchema,
  role: Joi.string().valid('USER', 'EMPLOYEE', 'ADMIN', 'STAFF').optional(),
  isActive: Joi.boolean().optional(),
  q: Joi.string().trim().max(200).optional(),
});

export const updateUserSchema = Joi.object({
  role: Joi.string().valid('USER', 'EMPLOYEE', 'ADMIN').optional(),
  isActive: Joi.boolean().optional(),
  name: Joi.string().trim().min(2).max(120).optional(),
}).min(1);

export const dashboardQuerySchema = Joi.object({
  days: Joi.number().integer().min(7).max(365).default(30),
});

export const notificationIdParamSchema = Joi.object({
  id: objectId.required(),
});

export default {
  listUsersQuerySchema,
  updateUserSchema,
  dashboardQuerySchema,
  notificationIdParamSchema,
};
