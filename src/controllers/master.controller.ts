/**
 * @file master.controller.ts
 * @description Master data (brands/models/locations/features) HTTP handlers.
 * @module Controllers
 * @author VehicleMarket Backend
 */

import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, createdResponse, buildPagination } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';
import * as masterService from '../services/master.service';

const pager = (q: any) => ({ page: Number(q.page) || 1, limit: Number(q.limit) || 200 });

// Brands
export const listBrands = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { category, isActive, all } = req.query as Record<string, any>;
  const filter: Record<string, any> = {};
  if (category) filter.category = category;
  if (isActive !== undefined) filter.isActive = isActive;
  const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'EMPLOYEE';
  if (all === true && isStaff) filter.all = true;
  const { data, totalItems } = await masterService.listBrands(filter, pager(req.query));
  const { page, limit } = pager(req.query);
  successResponse(res, data, 'Brands fetched', 200, buildPagination(page, limit, totalItems));
});
export const createBrand = asyncHandler(async (req, res) => createdResponse(res, await masterService.createBrand(req.body), 'Brand created'));
export const updateBrand = asyncHandler(async (req, res) => successResponse(res, await masterService.updateBrand(req.params.id, req.body), 'Brand updated'));
export const deleteBrand = asyncHandler(async (req, res) => successResponse(res, await masterService.deleteBrand(req.params.id), 'Brand deleted'));

// Models
export const listModels = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { brandId, category } = req.query as Record<string, any>;
  const filter: Record<string, any> = {};
  if (brandId) filter.brand = brandId;
  if (category) filter.category = category;
  const { data, totalItems } = await masterService.listModels(filter, pager(req.query));
  const { page, limit } = pager(req.query);
  successResponse(res, data, 'Models fetched', 200, buildPagination(page, limit, totalItems));
});
export const createModel = asyncHandler(async (req, res) => createdResponse(res, await masterService.createModel(req.body), 'Model created'));
export const updateModel = asyncHandler(async (req, res) => successResponse(res, await masterService.updateModel(req.params.id, req.body), 'Model updated'));
export const deleteModel = asyncHandler(async (req, res) => successResponse(res, await masterService.deleteModel(req.params.id), 'Model deleted'));

// Locations
export const listLocations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { isActive, q } = req.query as Record<string, any>;
  const filter: Record<string, any> = {};
  if (isActive !== undefined) filter.isActive = isActive;
  if (q) filter.$or = [{ state: new RegExp(q, 'i') }, { 'cities.name': new RegExp(q, 'i') }];
  const { data, totalItems } = await masterService.listLocations(filter, pager(req.query));
  const { page, limit } = pager(req.query);
  successResponse(res, data, 'Locations fetched', 200, buildPagination(page, limit, totalItems));
});
export const createLocation = asyncHandler(async (req, res) => createdResponse(res, await masterService.createLocation(req.body), 'Location created'));
export const updateLocation = asyncHandler(async (req, res) => successResponse(res, await masterService.updateLocation(req.params.id, req.body), 'Location updated'));
export const deleteLocation = asyncHandler(async (req, res) => successResponse(res, await masterService.deleteLocation(req.params.id), 'Location deleted'));

// Features
export const listFeatures = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { category, isActive } = req.query as Record<string, any>;
  const filter: Record<string, any> = {};
  if (category) filter.category = category;
  if (isActive !== undefined) filter.isActive = isActive;
  const { data, totalItems } = await masterService.listFeatures(filter, pager(req.query));
  const { page, limit } = pager(req.query);
  successResponse(res, data, 'Features fetched', 200, buildPagination(page, limit, totalItems));
});
export const createFeature = asyncHandler(async (req, res) => createdResponse(res, await masterService.createFeature(req.body), 'Feature created'));
export const updateFeature = asyncHandler(async (req, res) => successResponse(res, await masterService.updateFeature(req.params.id, req.body), 'Feature updated'));
export const deleteFeature = asyncHandler(async (req, res) => successResponse(res, await masterService.deleteFeature(req.params.id), 'Feature deleted'));

export default {
  listBrands, createBrand, updateBrand, deleteBrand,
  listModels, createModel, updateModel, deleteModel,
  listLocations, createLocation, updateLocation, deleteLocation,
  listFeatures, createFeature, updateFeature, deleteFeature,
};
