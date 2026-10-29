/**
 * @file Location.model.ts
 * @description Mongoose model for Indian states/UTs with cities and RTO codes
 *              (master data).
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface ICity {
  name: string;
  rtoCodes: string[];
}

export interface ILocation {
  _id: mongoose.Types.ObjectId;
  state: string;
  stateCode: string;
  cities: ICity[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const CitySchema = new Schema<ICity>(
  {
    name: { type: String, required: true, trim: true },
    rtoCodes: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.every((c) => /^[A-Z]{2}[0-9]{1,2}$/.test(c)),
        message: 'RTO codes must look like DL01',
      },
    },
  },
  { _id: false }
);

const LocationSchema = new Schema<ILocation>(
  {
    state: { type: String, required: true, unique: true, trim: true, index: true },
    stateCode: { type: String, required: true, trim: true, uppercase: true, maxlength: 3 },
    cities: { type: [CitySchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: true }
);

const Location: Model<ILocation> = mongoose.model<ILocation>('Location', LocationSchema);
export default Location;
