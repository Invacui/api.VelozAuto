/**
 * @file common.validator.ts
 * @description Shared Joi building blocks: pagination, ObjectId param, Indian
 *              phone / pincode / registration-number patterns.
 * @module Validators
 * @author VehicleMarket Backend
 */

import Joi from 'joi';
import {
  INDIAN_PHONE_REGEX,
  INDIAN_PINCODE_REGEX,
  normalizeIndianPhone,
} from '../shared/helpers/indian.helper';
import { REG_NUMBER_REGEX, BH_NUMBER_REGEX } from '../shared/helpers/registration.helper';
import { STATE_VALIDATORS } from '../constants/india';

export const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('must be a valid ObjectId');

export const idParamSchema = Joi.object({
  id: objectId.required(),
});

export const slugParamSchema = Joi.object({
  slug: Joi.string().min(2).max(200).required(),
});

export const paginationSchema = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

export const phoneSchema = Joi.string()
  .custom((value, helpers) => {
    const normalized = normalizeIndianPhone(value);
    if (!INDIAN_PHONE_REGEX.test(normalized)) {
      return helpers.error('any.invalid');
    }
    return normalized;
  }, 'indianPhone')
  .messages({
    'any.invalid': 'phone must be a valid 10-digit Indian mobile number (starts with 6-9)',
  });

export const pincodeSchema = Joi.string().pattern(INDIAN_PINCODE_REGEX).messages({
  'string.pattern.base': 'pincode must be a valid 6-digit Indian PIN code',
});

export const regNumberSchema = Joi.string()
  .uppercase()
  .custom((value, helpers) => {
    const v = String(value).replace(/\s+/g, '');
    if (!REG_NUMBER_REGEX.test(v) && !BH_NUMBER_REGEX.test(v)) {
      return helpers.error('any.invalid');
    }
    return v;
  }, 'regNumber')
  .messages({
    'any.invalid':
      'registration number must match a valid Indian format (e.g. MH12AB1234 or 22BH1234AA)',
  });

export const emailSchema = Joi.string().email().lowercase().trim();

export const stateSchema = Joi.string()
  .valid(...STATE_VALIDATORS)
  .messages({
    'any.only': 'state must be a valid Indian state/UT name',
  });

export const dateSchema = Joi.date().iso().messages({
  'date.iso': 'must be a valid ISO date (YYYY-MM-DD)',
});

export const dateStringSchema = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .messages({
    'string.pattern.base': 'must be in YYYY-MM-DD format',
  });

export const rtoCodeSchema = Joi.string()
  .uppercase()
  .pattern(/^[A-Z]{2}[0-9]{1,2}$/)
  .messages({
    'string.pattern.base': 'RTO code must look like DL01',
  });

export default {
  objectId,
  idParamSchema,
  slugParamSchema,
  paginationSchema,
  phoneSchema,
  pincodeSchema,
  regNumberSchema,
  emailSchema,
  stateSchema,
  dateSchema,
  dateStringSchema,
  rtoCodeSchema,
};
