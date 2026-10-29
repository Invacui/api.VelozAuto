/**
 * @file vehicle.controller.ts
 * @description Vehicle HTTP handlers — public search/detail and admin CRUD.
 * @module Controllers
 * @author VehicleMarket Backend
 */

import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, createdResponse, buildPagination } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';
import * as vehicleService from '../services/vehicle.service';

// ---------- Public ----------

export const listVehicles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { data, totalItems, page, limit } = await vehicleService.listVehicles(req.query);
  successResponse(res, data, 'Vehicles fetched', 200, buildPagination(page, limit, totalItems));
});

export const getFeatured = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const limit = Number(req.query.limit) || 8;
  const data = await vehicleService.getFeatured(limit);
  successResponse(res, data, 'Featured vehicles fetched');
});

export const getFiltersMeta = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const data = await vehicleService.getFiltersMeta();
  successResponse(res, data, 'Filter metadata fetched');
});

export const getBySlug = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vehicle = await vehicleService.getPublicBySlug(req.params.slug, { incrementView: true });
  successResponse(res, vehicle, 'Vehicle fetched');
});

export const getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vehicle = await vehicleService.getPublicById(req.params.id);
  successResponse(res, vehicle, 'Vehicle fetched');
});

export const getSimilar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const limit = Number(req.query.limit) || 6;
  const data = await vehicleService.getSimilar(req.params.id, limit);
  successResponse(res, data, 'Similar vehicles fetched');
});

// ---------- Admin / Employee ----------

export const adminList = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { data, totalItems, page, limit } = await vehicleService.listAdminVehicles(req.query);
  successResponse(res, data, 'Vehicles fetched', 200, buildPagination(page, limit, totalItems));
});

export const adminGetById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vehicle = await vehicleService.getStaffById(req.params.id);
  successResponse(res, vehicle, 'Vehicle fetched');
});

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vehicle = await vehicleService.createVehicle(req.body, req.user!.id);
  createdResponse(res, vehicle, 'Vehicle created successfully');
});

export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vehicle = await vehicleService.updateVehicle(req.params.id, req.body);
  successResponse(res, vehicle, 'Vehicle updated successfully');
});

export const updateStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vehicle = await vehicleService.updateStatus(req.params.id, req.body.status);
  successResponse(res, vehicle, 'Vehicle status updated');
});

export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await vehicleService.deleteVehicle(req.params.id);
  successResponse(res, result, 'Vehicle deleted');
});

export const addImages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  const tags = req.body.tags ? String(req.body.tags).split(',') : [];
  const vehicle = await vehicleService.addImages(req.params.id, files, tags);
  createdResponse(res, vehicle, 'Images uploaded successfully');
});

export const addImagesByUrl = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vehicle = await vehicleService.addImagesByUrl(req.params.id, req.body.images);
  createdResponse(res, vehicle, 'Images added successfully');
});

export const removeImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vehicle = await vehicleService.removeImage(req.params.id, req.params.imageId);
  successResponse(res, vehicle, 'Image removed');
});

export default {
  listVehicles,
  getFeatured,
  getFiltersMeta,
  getBySlug,
  getById,
  getSimilar,
  adminList,
  adminGetById,
  create,
  update,
  updateStatus,
  remove,
  addImages,
  removeImage,
};
