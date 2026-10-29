/**
 * @file Brand.model.ts
 * @description Mongoose model for vehicle brands (master data).
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';
import { VEHICLE_CATEGORIES } from '../constants/vehicleEnums';

export interface IBrand {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  categories: string[];
  logo?: string;
  country?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    categories: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0 && v.every((c) => VEHICLE_CATEGORIES.includes(c as any)),
        message: 'At least one valid category is required',
      },
    },
    logo: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, strict: true }
);

BrandSchema.pre('validate', function (next) {
  if (this.isNew && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  next();
});

const Brand: Model<IBrand> = mongoose.model<IBrand>('Brand', BrandSchema);
export default Brand;
