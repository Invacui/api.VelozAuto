/**
 * @file wishlist.service.ts
 * @description Wishlist (saved vehicles) service.
 * @module Services
 * @author VehicleMarket Backend
 */

import * as wishlistDao from '../dao/wishlist.dao';
import * as vehicleDao from '../dao/vehicle.dao';
import { AppError } from '../utils/AppError';
import { PaginationParams } from '../interfaces/request.interface';

export const addToWishlist = async (userId: string, vehicleId: string) => {
  const vehicle = await vehicleDao.findById(vehicleId);
  if (!vehicle || vehicle.deletedAt) throw new AppError('Vehicle not found.', 404);

  if (await wishlistDao.exists(userId, vehicleId)) {
    throw new AppError('Vehicle is already in your wishlist.', 409);
  }
  return wishlistDao.add(userId, vehicleId);
};

export const removeFromWishlist = async (userId: string, vehicleId: string) => {
  const removed = await wishlistDao.remove(userId, vehicleId);
  if (!removed) throw new AppError('Vehicle is not in your wishlist.', 404);
  return { vehicleId, removed: true };
};

export const listWishlist = async (userId: string, pagination: PaginationParams = {}) => {
  const data = await wishlistDao.findByUser(userId, pagination);
  const totalItems = await wishlistDao.countByUser(userId);
  // Drop entries whose vehicle was soft-deleted (populate match returns null)
  const filtered = data.filter((entry: any) => entry.vehicle);
  return { data: filtered, totalItems };
};

export default { addToWishlist, removeFromWishlist, listWishlist };
