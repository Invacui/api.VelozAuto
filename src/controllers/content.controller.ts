/**
 * @file content.controller.ts
 * @description Content HTTP handlers — banners, testimonials, FAQ, contacts,
 *              site settings and SEO settings.
 * @module Controllers
 * @author VehicleMarket Backend
 */

import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, createdResponse, buildPagination } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';
import * as contentService from '../services/content.service';

const pager = (q: any) => ({ page: Number(q.page) || 1, limit: Number(q.limit) || 50 });

// ---- Banners ----
export const listBanners = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filter: Record<string, any> = {};
  if (req.query.position) filter.position = req.query.position;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive;
  const { data, totalItems } = await contentService.listBanners(filter, pager(req.query));
  const { page, limit } = pager(req.query);
  successResponse(res, data, 'Banners fetched', 200, buildPagination(page, limit, totalItems));
});
export const createBanner = asyncHandler(async (req, res) => createdResponse(res, await contentService.createBanner(req.body), 'Banner created'));
export const updateBanner = asyncHandler(async (req, res) => successResponse(res, await contentService.updateBanner(req.params.id, req.body), 'Banner updated'));
export const deleteBanner = asyncHandler(async (req, res) => successResponse(res, await contentService.deleteBanner(req.params.id), 'Banner deleted'));

// ---- Testimonials ----
export const listTestimonials = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filter: Record<string, any> = {};
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive;
  const { data, totalItems } = await contentService.listTestimonials(filter, pager(req.query));
  const { page, limit } = pager(req.query);
  successResponse(res, data, 'Testimonials fetched', 200, buildPagination(page, limit, totalItems));
});
export const createTestimonial = asyncHandler(async (req, res) => createdResponse(res, await contentService.createTestimonial(req.body), 'Testimonial created'));
export const updateTestimonial = asyncHandler(async (req, res) => successResponse(res, await contentService.updateTestimonial(req.params.id, req.body), 'Testimonial updated'));
export const deleteTestimonial = asyncHandler(async (req, res) => successResponse(res, await contentService.deleteTestimonial(req.params.id), 'Testimonial deleted'));

// ---- FAQ ----
export const listFaqCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filter: Record<string, any> = {};
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive;
  const { data } = await contentService.listFaqCategories(filter);
  successResponse(res, data, 'FAQ categories fetched');
});
export const createFaqCategory = asyncHandler(async (req, res) => createdResponse(res, await contentService.createFaqCategory(req.body), 'FAQ category created'));
export const updateFaqCategory = asyncHandler(async (req, res) => successResponse(res, await contentService.updateFaqCategory(req.params.id, req.body), 'FAQ category updated'));
export const deleteFaqCategory = asyncHandler(async (req, res) => successResponse(res, await contentService.deleteFaqCategory(req.params.id), 'FAQ category deleted'));

export const listFaqArticles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filter: Record<string, any> = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive;
  const { data, totalItems } = await contentService.listFaqArticles(filter, pager(req.query));
  const { page, limit } = pager(req.query);
  successResponse(res, data, 'FAQ articles fetched', 200, buildPagination(page, limit, totalItems));
});
export const createFaqArticle = asyncHandler(async (req, res) => createdResponse(res, await contentService.createFaqArticle(req.body), 'FAQ article created'));
export const updateFaqArticle = asyncHandler(async (req, res) => successResponse(res, await contentService.updateFaqArticle(req.params.id, req.body), 'FAQ article updated'));
export const deleteFaqArticle = asyncHandler(async (req, res) => successResponse(res, await contentService.deleteFaqArticle(req.params.id), 'FAQ article deleted'));

export const getFaqTree = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const data = await contentService.getFaqTree();
  successResponse(res, data, 'FAQ fetched');
});

// ---- Contacts ----
export const createContact = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const contact = await contentService.createContact(req.body);
  createdResponse(res, contact, 'Thank you for reaching out. We will get back to you shortly.');
});
export const listContacts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filter: Record<string, any> = {};
  if (req.query.status) filter.status = req.query.status;
  const { data, totalItems } = await contentService.listContacts(filter, pager(req.query));
  const { page, limit } = pager(req.query);
  successResponse(res, data, 'Contact messages fetched', 200, buildPagination(page, limit, totalItems));
});
export const updateContact = asyncHandler(async (req, res) => successResponse(res, await contentService.updateContact(req.params.id, req.body), 'Contact message updated'));

// ---- Site settings ----
export const getSiteSettings = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  successResponse(res, await contentService.getSiteSettings(), 'Site settings fetched');
});
export const updateSiteSettings = asyncHandler(async (req, res) => successResponse(res, await contentService.updateSiteSettings(req.body), 'Site settings updated'));

// ---- SEO ----
export const listSeoSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { data, totalItems } = await contentService.listSeoSettings({}, pager(req.query));
  const { page, limit } = pager(req.query);
  successResponse(res, data, 'SEO settings fetched', 200, buildPagination(page, limit, totalItems));
});
export const getSeoByPath = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = await contentService.getSeoByPath(String(req.query.path || '/'));
  successResponse(res, data, 'SEO setting fetched');
});
export const upsertSeoSetting = asyncHandler(async (req, res) => successResponse(res, await contentService.upsertSeoSetting(req.body), 'SEO setting saved'));
export const deleteSeoSetting = asyncHandler(async (req, res) => successResponse(res, await contentService.deleteSeoSetting(req.params.id), 'SEO setting deleted'));

export default {
  listBanners, createBanner, updateBanner, deleteBanner,
  listTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  listFaqCategories, createFaqCategory, updateFaqCategory, deleteFaqCategory,
  listFaqArticles, createFaqArticle, updateFaqArticle, deleteFaqArticle, getFaqTree,
  createContact, listContacts, updateContact,
  getSiteSettings, updateSiteSettings,
  listSeoSettings, getSeoByPath, upsertSeoSetting, deleteSeoSetting,
};
