/**
 * @file siteSetting.dao.ts
 * @description Data Access Object for the SiteSetting singleton.
 * @module DAO
 * @author VehicleMarket Backend
 */

import SiteSetting from '../models/SiteSetting.model';

/** Returns the single settings document, creating it on first access. */
export const getSingleton = async () => {
  let doc = await SiteSetting.findOne().lean();
  if (!doc) {
    doc = (await SiteSetting.create({ siteName: 'VehicleMarket' })).toObject();
  }
  return doc;
};

export const updateSingleton = async (data: Record<string, any>) => {
  const existing = await SiteSetting.findOne();
  if (!existing) {
    return (await SiteSetting.create({ siteName: 'VehicleMarket', ...data })).toObject();
  }
  return SiteSetting.findByIdAndUpdate(existing._id, { $set: data }, { new: true, runValidators: true }).lean();
};

export default { getSingleton, updateSingleton };
