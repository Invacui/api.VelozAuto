/**
 * @file Banner.model.ts
 * @description Mongoose model for homepage banners/promos.
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';
import { BANNER_POSITIONS } from '../constants/vehicleEnums';

export interface IBanner {
  _id: mongoose.Types.ObjectId;
  title: string;
  subtitle?: string;
  image?: string;
  link?: string;
  position: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subtitle: { type: String, trim: true, maxlength: 400 },
    image: { type: String, trim: true },
    link: { type: String, trim: true },
    position: { type: String, enum: BANNER_POSITIONS, default: 'HERO', index: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: true }
);

BannerSchema.index({ position: 1, sortOrder: 1 });

const Banner: Model<IBanner> = mongoose.model<IBanner>('Banner', BannerSchema);
export default Banner;
