/**
 * @file auth.validator.ts
 * @description Joi validation schemas for auth endpoints.
 * @module Validators
 * @author VehicleMarket Backend
 */

import Joi from 'joi';
import { phoneSchema } from './common.validator';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .required()
    .messages({
      'string.pattern.base': 'password must contain at least one letter and one number',
    }),
  phone: phoneSchema.optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

export const googleSchema = Joi.object({
  credential: Joi.string().min(20).max(10000).required(),
});

export const sendPhoneOtpSchema = Joi.object({
  phone: phoneSchema.optional(),
});

export const verifyPhoneOtpSchema = Joi.object({
  code: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({ 'string.pattern.base': 'code must be a 6-digit number' }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().optional(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .required()
    .messages({
      'string.pattern.base': 'password must contain at least one letter and one number',
    }),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(120).optional(),
  phone: phoneSchema.optional(),
  profileImage: Joi.string().max(500).optional().allow('', null),
}).min(1);

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .required()
    .messages({
      'string.pattern.base': 'newPassword must contain at least one letter and one number',
    }),
});

export const verifyEmailParamsSchema = Joi.object({
  token: Joi.string().required(),
});

export default {
  registerSchema,
  loginSchema,
  googleSchema,
  sendPhoneOtpSchema,
  verifyPhoneOtpSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailParamsSchema,
  updateProfileSchema,
  changePasswordSchema,
};
