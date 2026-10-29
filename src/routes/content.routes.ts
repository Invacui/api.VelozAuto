/**
 * @file content.routes.ts
 * @description Content routes mounted at /api/v1/content.
 * @module Routes
 * @author VehicleMarket Backend
 */

import { Router } from 'express';
import validate from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { strictLimiter } from '../middleware/rateLimiter.middleware';
import * as contentController from '../controllers/content.controller';
import {
  createBannerSchema, updateBannerSchema,
  createTestimonialSchema, updateTestimonialSchema,
  createFaqCategorySchema, updateFaqCategorySchema,
  createFaqArticleSchema, updateFaqArticleSchema,
  createContactSchema, updateContactSchema,
  updateSiteSettingSchema, upsertSeoSettingSchema, listContentQuerySchema,
} from '../validators/content.validator';
import { idParamSchema } from '../validators/common.validator';

const router = Router();
const admin = [authenticate, requireRole('ADMIN')];

// ---- Public reads ----
router.get('/banners', validate({ query: listContentQuerySchema }), contentController.listBanners);
router.get('/testimonials', validate({ query: listContentQuerySchema }), contentController.listTestimonials);
router.get('/faqs', contentController.getFaqTree);
router.get('/faq-categories', validate({ query: listContentQuerySchema }), contentController.listFaqCategories);
router.get('/faq-articles', validate({ query: listContentQuerySchema }), contentController.listFaqArticles);
router.get('/site-settings', contentController.getSiteSettings);
router.get('/seo', contentController.getSeoByPath);
router.post('/contacts', strictLimiter, validate({ body: createContactSchema }), contentController.createContact);

// ---- Banners (admin) ----
router.post('/banners', ...admin, validate({ body: createBannerSchema }), contentController.createBanner);
router.put('/banners/:id', ...admin, validate({ params: idParamSchema, body: updateBannerSchema }), contentController.updateBanner);
router.delete('/banners/:id', ...admin, validate({ params: idParamSchema }), contentController.deleteBanner);

// ---- Testimonials (admin) ----
router.post('/testimonials', ...admin, validate({ body: createTestimonialSchema }), contentController.createTestimonial);
router.put('/testimonials/:id', ...admin, validate({ params: idParamSchema, body: updateTestimonialSchema }), contentController.updateTestimonial);
router.delete('/testimonials/:id', ...admin, validate({ params: idParamSchema }), contentController.deleteTestimonial);

// ---- FAQ (admin) ----
router.post('/faq-categories', ...admin, validate({ body: createFaqCategorySchema }), contentController.createFaqCategory);
router.put('/faq-categories/:id', ...admin, validate({ params: idParamSchema, body: updateFaqCategorySchema }), contentController.updateFaqCategory);
router.delete('/faq-categories/:id', ...admin, validate({ params: idParamSchema }), contentController.deleteFaqCategory);
router.post('/faq-articles', ...admin, validate({ body: createFaqArticleSchema }), contentController.createFaqArticle);
router.put('/faq-articles/:id', ...admin, validate({ params: idParamSchema, body: updateFaqArticleSchema }), contentController.updateFaqArticle);
router.delete('/faq-articles/:id', ...admin, validate({ params: idParamSchema }), contentController.deleteFaqArticle);

// ---- Contacts (admin) ----
router.get('/contacts', ...admin, validate({ query: listContentQuerySchema }), contentController.listContacts);
router.patch('/contacts/:id', ...admin, validate({ params: idParamSchema, body: updateContactSchema }), contentController.updateContact);

// ---- Site settings (admin) ----
router.put('/site-settings', ...admin, validate({ body: updateSiteSettingSchema }), contentController.updateSiteSettings);

// ---- SEO settings (admin) ----
router.get('/seo-settings', ...admin, validate({ query: listContentQuerySchema }), contentController.listSeoSettings);
router.put('/seo-settings', ...admin, validate({ body: upsertSeoSettingSchema }), contentController.upsertSeoSetting);
router.delete('/seo-settings/:id', ...admin, validate({ params: idParamSchema }), contentController.deleteSeoSetting);

export default router;
