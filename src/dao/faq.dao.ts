/**
 * @file faq.dao.ts
 * @description Data Access Object for FAQ categories and articles.
 * @module DAO
 * @author VehicleMarket Backend
 */

import FaqCategory from '../models/FaqCategory.model';
import FaqArticle from '../models/FaqArticle.model';
import { PaginationParams } from '../interfaces/request.interface';

// ---- Categories ----
export const createCategory = async (data: Record<string, any>) =>
  (await FaqCategory.create(data)).toObject();
export const findCategoryById = async (id: string) => FaqCategory.findById(id).lean();
export const updateCategory = async (id: string, data: Record<string, any>) =>
  FaqCategory.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
export const removeCategory = async (id: string) => FaqCategory.findByIdAndDelete(id).lean();
export const findCategories = async (filter: Record<string, any> = {}) =>
  FaqCategory.find(filter).sort({ sortOrder: 1, title: 1 }).lean();
export const countCategories = async (filter: Record<string, any> = {}) =>
  FaqCategory.countDocuments(filter);

// ---- Articles ----
export const createArticle = async (data: Record<string, any>) =>
  (await FaqArticle.create(data)).toObject();
export const findArticleById = async (id: string) => FaqArticle.findById(id).lean();
export const updateArticle = async (id: string, data: Record<string, any>) =>
  FaqArticle.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();
export const removeArticle = async (id: string) => FaqArticle.findByIdAndDelete(id).lean();
export const findArticles = async (
  filter: Record<string, any> = {},
  pagination: PaginationParams = {}
) => {
  const { page = 1, limit = 200 } = pagination;
  const skip = (page - 1) * limit;
  return FaqArticle.find(filter)
    .populate('category', 'title slug')
    .sort({ sortOrder: 1, createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
};
export const countArticles = async (filter: Record<string, any> = {}) =>
  FaqArticle.countDocuments(filter);

export default {
  createCategory,
  findCategoryById,
  updateCategory,
  removeCategory,
  findCategories,
  countCategories,
  createArticle,
  findArticleById,
  updateArticle,
  removeArticle,
  findArticles,
  countArticles,
};
