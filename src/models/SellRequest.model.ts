/**
 * @file SellRequest.model.ts
 * @description Mongoose model for SellRequest — a seller offers their own
 *              vehicle. Pipeline: SUBMITTED → UNDER_REVIEW →
 *              INSPECTION_SCHEDULED → INSPECTED → OFFER_MADE →
 *              ACCEPTED / REJECTED / NEGOTIATING → LISTED / CLOSED.
 *              One-click conversion creates the Vehicle listing.
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';
import {
  VEHICLE_CATEGORIES,
  USAGE_TYPES,
  COMMERCIAL_SUB_CATEGORIES,
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSIONS,
  BS_NORMS,
  OWNER_COUNTS,
  SELL_REQUEST_STATUSES,
  SELLER_TYPES,
  SELL_IMAGE_TAGS,
  SELL_INSPECTION_SLOTS,
  REGISTRATION_TYPES,
  INSURANCE_TYPES,
  LOAN_STATUSES,
  ACCIDENT_HISTORY,
  TYRE_CONDITIONS,
  SELL_VEHICLE_CONDITIONS,
} from '../constants/vehicleEnums';
import { STATE_VALIDATORS } from '../constants/india';
import { isValidIndianPhone, normalizeIndianPhone, isValidPincode } from '../shared/helpers/indian.helper';
import { StatusHistoryEntry, InternalNote } from './BuyRequest.model';

export interface SellImage {
  _id?: mongoose.Types.ObjectId;
  url: string;
  s3Key?: string;
  tag: string;
}

export interface ISellRequest {
  _id: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  // Seller
  name: string;
  phone: string;
  email?: string;
  city?: string;
  pincode?: string;
  inspectionSlot?: string;
  sellerType?: string;
  expectedPrice?: number;
  // Vehicle
  category?: string;
  usageType?: string;
  subCategory?: string;
  bodyType?: string;
  brand?: mongoose.Types.ObjectId;
  brandName?: string;
  model?: string;
  variant?: string;
  manufacturingYear?: number;
  registrationYear?: number;
  color?: string;
  fuelType?: string;
  transmission?: string;
  bsNorm?: string;
  engineCapacityCc?: number;
  powerBhp?: number;
  kmDriven?: number;
  ownerCount?: string;
  seats?: number;
  registrationNumber?: string;
  registrationState?: string;
  rtoCode?: string;
  registrationCity?: string;
  registrationType?: string;
  rcAvailable: boolean;
  insuranceType?: string;
  insuranceValidTill?: Date;
  loanStatus?: string;
  financierName?: string;
  accidentHistory?: string;
  floodDamage: boolean;
  serviceHistoryAvailable: boolean;
  tyreCondition?: string;
  condition?: string;
  description?: string;
  grossVehicleWeightKg?: number;
  payloadCapacityKg?: number;
  axleConfiguration?: string;
  numberOfTyres?: number;
  sleepingCapacity?: number;
  hasKitchenette?: boolean;
  hasToilet?: boolean;
  images: SellImage[];
  // Pipeline
  status: string;
  offerPrice?: number;
  inspectionDate?: Date;
  inspector?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  internalNotes: InternalNote[];
  statusHistory: StatusHistoryEntry[];
  listedVehicle?: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const SellImageSchema = new Schema<SellImage>(
  {
    url: { type: String, required: true, trim: true },
    s3Key: { type: String, trim: true },
    tag: { type: String, enum: SELL_IMAGE_TAGS, default: 'FRONT' },
  },
  { _id: true }
);

const StatusHistorySchema = new Schema(
  {
    from: { type: String, default: null },
    to: { type: String, required: true },
    note: { type: String, trim: true, maxlength: 1000 },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const InternalNoteSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, required: true, trim: true, maxlength: 2000 },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const SellRequestSchema = new Schema<ISellRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },

    // ---- Seller ----
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v: string) => isValidIndianPhone(v),
        message: 'Phone must be a valid 10-digit Indian mobile number (starts 6-9)',
      },
      set: (v: string) => normalizeIndianPhone(v),
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    city: { type: String, trim: true, maxlength: 100 },
    pincode: {
      type: String,
      trim: true,
      validate: {
        validator: (v: string) => !v || isValidPincode(v),
        message: 'PIN code must be a valid 6-digit Indian PIN code',
      },
    },
    inspectionSlot: { type: String, enum: [...SELL_INSPECTION_SLOTS, null] },
    sellerType: { type: String, enum: SELLER_TYPES, default: 'INDIVIDUAL' },
    expectedPrice: { type: Number, min: [0, 'Expected price cannot be negative'] },

    // ---- Vehicle ----
    category: { type: String, enum: VEHICLE_CATEGORIES, index: true },
    usageType: { type: String, enum: USAGE_TYPES },
    subCategory: { type: String, enum: [...COMMERCIAL_SUB_CATEGORIES, null] },
    bodyType: { type: String, enum: [...BODY_TYPES, null] },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand' },
    brandName: { type: String, trim: true },
    model: { type: String, trim: true },
    variant: { type: String, trim: true },
    manufacturingYear: {
      type: Number,
      min: 1980,
      max: new Date().getFullYear() + 1,
    },
    registrationYear: { type: Number, min: 1980, max: new Date().getFullYear() + 1 },
    color: { type: String, trim: true, maxlength: 40 },
    fuelType: { type: String, enum: FUEL_TYPES },
    transmission: { type: String, enum: TRANSMISSIONS },
    bsNorm: { type: String, enum: [...BS_NORMS, null] },
    engineCapacityCc: { type: Number, min: 0, max: 20000 },
    powerBhp: { type: Number, min: 0, max: 3000 },
    kmDriven: { type: Number, min: 0, max: 1000000 },
    condition: { type: String, enum: [...SELL_VEHICLE_CONDITIONS, null] },
    ownerCount: { type: String, enum: OWNER_COUNTS },
    seats: { type: Number, min: 1, max: 100 },
    registrationNumber: { type: String, trim: true, uppercase: true },
    registrationState: { type: String, trim: true, enum: STATE_VALIDATORS },
    rtoCode: { type: String, trim: true, uppercase: true },
    registrationCity: { type: String, trim: true },
    registrationType: { type: String, enum: [...REGISTRATION_TYPES, null] },
    rcAvailable: { type: Boolean, default: true },
    insuranceType: { type: String, enum: INSURANCE_TYPES },
    insuranceValidTill: { type: Date },
    loanStatus: { type: String, enum: LOAN_STATUSES, default: 'NO_LOAN' },
    financierName: { type: String, trim: true },
    accidentHistory: { type: String, enum: ACCIDENT_HISTORY, default: 'NONE' },
    floodDamage: { type: Boolean, default: false },
    serviceHistoryAvailable: { type: Boolean, default: false },
    tyreCondition: { type: String, enum: TYRE_CONDITIONS, default: 'GOOD' },
    description: { type: String, trim: true, maxlength: 8000 },
    grossVehicleWeightKg: { type: Number, min: 0, max: 100000 },
    payloadCapacityKg: { type: Number, min: 0, max: 100000 },
    axleConfiguration: { type: String, trim: true },
    numberOfTyres: { type: Number, min: 2, max: 40 },
    sleepingCapacity: { type: Number, min: 0, max: 20 },
    hasKitchenette: { type: Boolean, default: false },
    hasToilet: { type: Boolean, default: false },
    images: { type: [SellImageSchema], default: [] },

    // ---- Pipeline ----
    status: { type: String, enum: SELL_REQUEST_STATUSES, default: 'SUBMITTED', index: true },
    offerPrice: { type: Number, min: 0 },
    inspectionDate: { type: Date },
    inspector: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, trim: true, maxlength: 2000 },
    internalNotes: { type: [InternalNoteSchema], default: [] },
    statusHistory: { type: [StatusHistorySchema], default: [] },
    listedVehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  },
  {
    timestamps: true,
    strict: true,
  }
);

SellRequestSchema.index({ status: 1, createdAt: -1 });
SellRequestSchema.index({ phone: 1, createdAt: -1 });
SellRequestSchema.index({ user: 1, createdAt: -1 });

const SellRequest: Model<ISellRequest> = mongoose.model<ISellRequest>('SellRequest', SellRequestSchema);

export default SellRequest;
