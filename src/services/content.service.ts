/**
 * @file content.service.ts
 * @description Content service — banners, testimonials, FAQ categories/articles,
 *              contact messages, site settings and per-page SEO settings.
 * @module Services
 * @author VehicleMarket Backend
 */

import * as bannerDao from '../dao/banner.dao';
import * as testimonialDao from '../dao/testimonial.dao';
import * as faqDao from '../dao/faq.dao';
import * as contactDao from '../dao/contact.dao';
import * as siteSettingDao from '../dao/siteSetting.dao';
import * as seoSettingDao from '../dao/seoSetting.dao';
import { AppError } from '../utils/AppError';
import { PaginationParams } from '../interfaces/request.interface';
import { createAdminNotification } from './notification.service';
import { sendWhatsAppAcknowledgement } from './whatsapp.service';

// =====================
// Banners
// =====================

export const listBanners = async (filter: Record<string, any> = {}, pagination: PaginationParams = {}) => {
  const data = await bannerDao.findAll(filter, pagination);
  const totalItems = await bannerDao.countAll(filter);
  return { data, totalItems };
};

export const createBanner = (data: Record<string, any>) => bannerDao.create(data);

export const updateBanner = async (id: string, data: Record<string, any>) => {
  const existing = await bannerDao.findById(id);
  if (!existing) throw new AppError('Banner not found.', 404);
  return bannerDao.updateById(id, data);
};

export const deleteBanner = async (id: string) => {
  const existing = await bannerDao.findById(id);
  if (!existing) throw new AppError('Banner not found.', 404);
  await bannerDao.removeById(id);
  return { id, deleted: true };
};

// =====================
// Testimonials
// =====================

export const listTestimonials = async (filter: Record<string, any> = {}, pagination: PaginationParams = {}) => {
  const data = await testimonialDao.findAll(filter, pagination);
  const totalItems = await testimonialDao.countAll(filter);
  return { data, totalItems };
};

export const createTestimonial = (data: Record<string, any>) => testimonialDao.create(data);

export const updateTestimonial = async (id: string, data: Record<string, any>) => {
  const existing = await testimonialDao.findById(id);
  if (!existing) throw new AppError('Testimonial not found.', 404);
  return testimonialDao.updateById(id, data);
};

export const deleteTestimonial = async (id: string) => {
  const existing = await testimonialDao.findById(id);
  if (!existing) throw new AppError('Testimonial not found.', 404);
  await testimonialDao.removeById(id);
  return { id, deleted: true };
};

// =====================
// FAQ
// =====================

export const listFaqCategories = async (filter: Record<string, any> = {}) => {
  const data = await faqDao.findCategories(filter);
  return { data, totalItems: data.length };
};

export const createFaqCategory = (data: Record<string, any>) => faqDao.createCategory(data);

export const updateFaqCategory = async (id: string, data: Record<string, any>) => {
  const existing = await faqDao.findCategoryById(id);
  if (!existing) throw new AppError('FAQ category not found.', 404);
  return faqDao.updateCategory(id, data);
};

export const deleteFaqCategory = async (id: string) => {
  const existing = await faqDao.findCategoryById(id);
  if (!existing) throw new AppError('FAQ category not found.', 404);
  await faqDao.removeCategory(id);
  return { id, deleted: true };
};

export const listFaqArticles = async (filter: Record<string, any> = {}, pagination: PaginationParams = {}) => {
  const data = await faqDao.findArticles(filter, pagination);
  const totalItems = await faqDao.countArticles(filter);
  return { data, totalItems };
};

export const createFaqArticle = (data: Record<string, any>) => faqDao.createArticle(data);

export const updateFaqArticle = async (id: string, data: Record<string, any>) => {
  const existing = await faqDao.findArticleById(id);
  if (!existing) throw new AppError('FAQ article not found.', 404);
  return faqDao.updateArticle(id, data);
};

export const deleteFaqArticle = async (id: string) => {
  const existing = await faqDao.findArticleById(id);
  if (!existing) throw new AppError('FAQ article not found.', 404);
  await faqDao.removeArticle(id);
  return { id, deleted: true };
};

/** Group active articles under their categories (public FAQ page). */
export const getFaqTree = async () => {
  const [categories, articles] = await Promise.all([
    faqDao.findCategories({ isActive: true }),
    faqDao.findArticles({ isActive: true }, { limit: 500 }),
  ]);
  return categories.map((cat: any) => ({
    ...cat,
    articles: articles.filter((a: any) => String(a.category) === String(cat._id)),
  }));
};

// =====================
// Contacts
// =====================

export const createContact = async (data: Record<string, any>) => {
  const contact = await contactDao.create(data);
  try {
    await createAdminNotification(
      'NEW_CONTACT',
      'New contact message',
      `${contact.name}: ${contact.subject || 'General enquiry'}`,
      `/admin/contacts/${contact._id}`
    );
  } catch {
    /* non-fatal */
  }

  if (contact.phone) {
    const subject = contact.subject ? ` about "${contact.subject}"` : '';
    void sendWhatsAppAcknowledgement({
      to: contact.phone,
      name: contact.name,
      message: `we received your message${subject}. Our team will get back to you shortly.`,
      reference: `contact:${contact._id}`,
    });
  }

  return contact;
};

export const listContacts = async (filter: Record<string, any> = {}, pagination: PaginationParams = {}) => {
  const data = await contactDao.findAll(filter, pagination);
  const totalItems = await contactDao.countAll(filter);
  return { data, totalItems };
};

export const updateContact = async (id: string, data: Record<string, any>) => {
  const existing = await contactDao.findById(id);
  if (!existing) throw new AppError('Contact message not found.', 404);
  return contactDao.updateById(id, data);
};

// =====================
// Site settings
// =====================

export const getSiteSettings = () => siteSettingDao.getSingleton();

export const updateSiteSettings = async (data: Record<string, any>) => siteSettingDao.updateSingleton(data);

// =====================
// SEO settings
// =====================

export const listSeoSettings = async (filter: Record<string, any> = {}, pagination: PaginationParams = {}) => {
  const data = await seoSettingDao.findAll(filter, pagination);
  const totalItems = await seoSettingDao.countAll(filter);
  return { data, totalItems };
};

export const getSeoByPath = async (path: string) => seoSettingDao.findByPath(path);

export const upsertSeoSetting = async (data: Record<string, any>) => {
  const { path, ...rest } = data;
  if (!path) throw new AppError('A path is required.', 422);
  return seoSettingDao.upsertByPath(path, rest);
};

export const deleteSeoSetting = async (id: string) => {
  const existing = await seoSettingDao.findById(id);
  if (!existing) throw new AppError('SEO setting not found.', 404);
  await seoSettingDao.removeById(id);
  return { id, deleted: true };
};

export default {
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  listTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  listFaqCategories,
  createFaqCategory,
  updateFaqCategory,
  deleteFaqCategory,
  listFaqArticles,
  createFaqArticle,
  updateFaqArticle,
  deleteFaqArticle,
  getFaqTree,
  createContact,
  listContacts,
  updateContact,
  getSiteSettings,
  updateSiteSettings,
  listSeoSettings,
  getSeoByPath,
  upsertSeoSetting,
  deleteSeoSetting,
};
