/**
 * @file Feature.model.ts
 * @description Mongoose model for feature tags (master data).
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';
import { FEATURE_CATEGORIES, VEHICLE_CATEGORIES } from '../constants/vehicleEnums';

export interface IFeature {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  category: string;
  applicableCategories: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const FeatureSchema = new Schema<IFeature>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    category: { type: String, required: true, enum: FEATURE_CATEGORIES, default: 'COMFORT' },
    applicableCategories: { type: [String], enum: VEHICLE_CATEGORIES, default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: true }
);

FeatureSchema.pre('validate', function (next) {
  if (this.isNew && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  next();
});

const Feature: Model<IFeature> = mongoose.model<IFeature>('Feature', FeatureSchema);
export default Feature;
