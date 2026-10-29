/**
 * @file content.validator.ts
 * @description Joi validation schemas for content modules (banners,
 *              testimonials, FAQ, contacts, site settings, SEO).
 * @module Validators
 * @author VehicleMarket Backend
 */

import Joi from 'joi';
import { BANNER_POSITIONS, CONTACT_STATUSES } from '../constants/vehicleEnums';
import { objectId, paginationSchema, phoneSchema } from './common.validator';

const optionalStr = (max = 255) => Joi.string().trim().max(max).optional().allow('', null);

// ---- Banners ----
export const createBannerSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  subtitle: optionalStr(400),
  image: optionalStr(1000),
  link: optionalStr(500),
  position: Joi.string().valid(...BANNER_POSITIONS).optional(),
  sortOrder: Joi.number().integer().optional(),
  isActive: Joi.boolean().optional(),
});
export const updateBannerSchema = createBannerSchema.fork(['title'], (s) => s.optional()).min(1);

// ---- Testimonials ----
export const createTestimonialSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  city: optionalStr(100),
  role: optionalStr(120),
  quote: Joi.string().trim().min(1).max(2000).required(),
  rating: Joi.number().integer().min(1).max(5).optional(),
  avatar: optionalStr(1000),
  isActive: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().optional(),
});
export const updateTestimonialSchema = createTestimonialSchema
  .fork(['name', 'quote'], (s) => s.optional())
  .min(1);

// ---- FAQ ----
export const createFaqCategorySchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  slug: optionalStr(160),
  description: optionalStr(1000),
  sortOrder: Joi.number().integer().optional(),
  isActive: Joi.boolean().optional(),
});
export const updateFaqCategorySchema = createFaqCategorySchema
  .fork(['title'], (s) => s.optional())
  .min(1);

export const createFaqArticleSchema = Joi.object({
  category: objectId.required(),
  question: Joi.string().trim().min(3).max(500).required(),
  answer: Joi.string().trim().min(3).max(8000).required(),
  sortOrder: Joi.number().integer().optional(),
  isActive: Joi.boolean().optional(),
});
export const updateFaqArticleSchema = createFaqArticleSchema
  .fork(['category', 'question', 'answer'], (s) => s.optional())
  .min(1);

// ---- Contacts ----
export const createContactSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().email().lowercase().trim().required(),
  phone: phoneSchema.optional().allow('', null),
  subject: Joi.string().trim().min(2).max(200).required(),
  message: Joi.string().trim().min(5).max(4000).required(),
});
export const updateContactSchema = Joi.object({
  status: Joi.string().valid(...CONTACT_STATUSES).optional(),
  adminNotes: optionalStr(4000),
}).min(1);

// ---- Site settings ----
export const updateSiteSettingSchema = Joi.object({
  siteName: Joi.string().trim().max(120).optional(),
  tagline: optionalStr(300),
  phone: optionalStr(30),
  email: Joi.string().email().optional().allow('', null),
  whatsapp: optionalStr(30),
  address: optionalStr(500),
  workingHours: optionalStr(200),
  facebook: optionalStr(500),
  instagram: optionalStr(500),
  twitter: optionalStr(500),
  youtube: optionalStr(500),
  linkedin: optionalStr(500),
  defaultMeta: Joi.object({
    title: optionalStr(200),
    description: optionalStr(400),
    image: optionalStr(1000),
  }).optional(),
  footerText: optionalStr(1000),
  termsContent: optionalStr(100000),
  privacyContent: optionalStr(100000),
  legalUpdatedAt: Joi.date().iso().optional().allow(null),
}).min(1);

// ---- SEO settings ----
export const upsertSeoSettingSchema = Joi.object({
  path: Joi.string().trim().max(300).required(),
  title: optionalStr(200),
  description: optionalStr(400),
  keywords: Joi.array().items(Joi.string().trim().max(80)).optional(),
  ogImage: optionalStr(1000),
  canonical: optionalStr(1000),
  noindex: Joi.boolean().optional(),
  jsonLd: Joi.object().optional().allow(null),
});

// ---- List queries ----
export const listContentQuerySchema = Joi.object({
  ...paginationSchema,
  isActive: Joi.boolean().optional(),
  position: Joi.string().valid(...BANNER_POSITIONS).optional(),
  status: Joi.string().valid(...CONTACT_STATUSES).optional(),
  category: objectId.optional(),
});

export default {
  createBannerSchema,
  updateBannerSchema,
  createTestimonialSchema,
  updateTestimonialSchema,
  createFaqCategorySchema,
  updateFaqCategorySchema,
  createFaqArticleSchema,
  updateFaqArticleSchema,
  createContactSchema,
  updateContactSchema,
  updateSiteSettingSchema,
  upsertSeoSettingSchema,
  listContentQuerySchema,
};
