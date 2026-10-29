/**
 * @file wishlist.controller.ts
 * @description Wishlist HTTP handlers.
 * @module Controllers
 * @author VehicleMarket Backend
 */

import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, createdResponse, buildPagination } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';
import * as wishlistService from '../services/wishlist.service';

export const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { data, totalItems } = await wishlistService.listWishlist(req.user!.id, req.query);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  successResponse(res, data, 'Wishlist fetched', 200, buildPagination(page, limit, totalItems));
});

export const add = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const entry = await wishlistService.addToWishlist(req.user!.id, req.params.vehicleId);
  createdResponse(res, entry, 'Added to wishlist');
});

export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await wishlistService.removeFromWishlist(req.user!.id, req.params.vehicleId);
  successResponse(res, result, 'Removed from wishlist');
});

export default { list, add, remove };
