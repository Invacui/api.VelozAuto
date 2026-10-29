/**
 * @file wishlist.dao.ts
 * @description Data Access Object for Wishlist model.
 * @module DAO
 * @author VehicleMarket Backend
 */

import Wishlist from '../models/Wishlist.model';
import { PaginationParams } from '../interfaces/request.interface';

export const add = async (user: string, vehicle: string) =>
  (await Wishlist.create({ user, vehicle })).toObject();

export const remove = async (user: string, vehicle: string) =>
  Wishlist.findOneAndDelete({ user, vehicle }).lean();

export const exists = async (user: string, vehicle: string) =>
  (await Wishlist.exists({ user, vehicle })) !== null;

export const findByUser = async (userId: string, pagination: PaginationParams = {}) => {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;
  return Wishlist.find({ user: userId })
    .populate({
      path: 'vehicle',
      match: { deletedAt: null },
      select:
        'brandName model variant manufacturingYear fuelType transmission kmDriven price images slug locationCity status isFeatured',
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countByUser = async (userId: string) => Wishlist.countDocuments({ user: userId });

export default { add, remove, exists, findByUser, countByUser };
