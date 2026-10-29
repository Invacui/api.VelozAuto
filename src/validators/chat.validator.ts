/**
 * @file chat.validator.ts
 * @description Joi validation schemas for live-chat endpoints.
 * @module Validators
 * @author VehicleMarket Backend
 */

import Joi from 'joi';
import { CHAT_CATEGORIES, CHAT_PRIORITIES, CHAT_STATUSES } from '../constants/vehicleEnums';
import { objectId, paginationSchema } from './common.validator';

export const createTicketSchema = Joi.object({
  subject: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().trim().max(4000).optional().allow('', null),
  category: Joi.string().valid(...CHAT_CATEGORIES).optional(),
  priority: Joi.string().valid(...CHAT_PRIORITIES).optional(),
  relatedVehicle: objectId.optional().allow(null),
  relatedBuyRequest: objectId.optional().allow(null),
});

export const updateTicketSchema = Joi.object({
  status: Joi.string().valid(...CHAT_STATUSES).optional(),
  priority: Joi.string().valid(...CHAT_PRIORITIES).optional(),
  assignedTo: objectId.optional().allow(null),
}).min(1);

export const sendMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(4000).required(),
  imageUrl: Joi.string().uri({ allowRelative: true }).max(1000).optional().allow('', null),
});

export const listTicketsQuerySchema = Joi.object({
  ...paginationSchema,
  status: Joi.string().valid(...CHAT_STATUSES).optional(),
  assignedTo: objectId.optional(),
  priority: Joi.string().valid(...CHAT_PRIORITIES).optional(),
});

export default {
  createTicketSchema,
  updateTicketSchema,
  sendMessageSchema,
  listTicketsQuerySchema,
};
