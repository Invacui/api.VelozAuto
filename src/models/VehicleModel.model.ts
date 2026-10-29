/**
 * @file VehicleModel.model.ts
 * @description Mongoose model for vehicle models per brand (master data).
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';
import { VEHICLE_CATEGORIES, BODY_TYPES, FUEL_TYPES, TRANSMISSIONS } from '../constants/vehicleEnums';

export interface IVehicleModel {
  _id: mongoose.Types.ObjectId;
  brand: mongoose.Types.ObjectId;
  brandName: string;
  name: string;
  slug: string;
  category: string;
  bodyTypes: string[];
  fuelOptions: string[];
  transmissionOptions: string[];
  priceRange?: { min: number; max: number };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const VehicleModelSchema = new Schema<IVehicleModel>(
  {
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    brandName: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true, index: true },
    category: { type: String, required: true, enum: VEHICLE_CATEGORIES, index: true },
    bodyTypes: { type: [String], enum: BODY_TYPES, default: [] },
    fuelOptions: { type: [String], enum: FUEL_TYPES, default: [] },
    transmissionOptions: { type: [String], enum: TRANSMISSIONS, default: [] },
    priceRange: {
      type: new Schema({ min: { type: Number, min: 0 }, max: { type: Number, min: 0 } }, { _id: false }),
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: true }
);

VehicleModelSchema.index({ brand: 1, slug: 1 }, { unique: true });

VehicleModelSchema.pre('validate', function (next) {
  if (this.isNew && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  next();
});

const VehicleModel: Model<IVehicleModel> = mongoose.model<IVehicleModel>('VehicleModel', VehicleModelSchema);
export default VehicleModel;
