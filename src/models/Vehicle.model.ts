/**
 * @file Vehicle.model.ts
 * @description Mongoose model for Vehicle — a used-vehicle listing. Covers
 *              core specs, India registration/legal fields, commercial and
 *              caravan-specific blocks, media, and listing metadata.
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
  VEHICLE_STATUSES,
  IMAGE_TAGS,
  REGISTRATION_TYPES,
  RC_TYPES,
  OWNERSHIP_TRANSFER_STATUS,
  ROAD_TAX_STATUSES,
  PERMIT_TYPES,
  ACCIDENT_HISTORY,
  TYRE_CONDITIONS,
  WARRANTY_TYPES,
  AXLE_CONFIGURATIONS,
  CABIN_TYPES,
  SELLER_TYPES,
} from '../constants/vehicleEnums';
import { STATE_VALIDATORS } from '../constants/india';
import { isValidIndianPhone } from '../shared/helpers/indian.helper';

// ---------------- Sub-documents ----------------

export interface VehicleImage {
  _id?: mongoose.Types.ObjectId;
  url: string;
  s3Key?: string;
  order: number;
  isPrimary: boolean;
  tag?: string;
}

export interface VehicleWarranty {
  months?: number;
  km?: number;
  type: string;
}

const VehicleImageSchema = new Schema<VehicleImage>(
  {
    url: { type: String, required: true, trim: true },
    s3Key: { type: String, trim: true },
    order: { type: Number, default: 0, min: 0 },
    isPrimary: { type: Boolean, default: false },
    tag: { type: String, enum: [...IMAGE_TAGS, null], default: 'EXTERIOR' },
  },
  { _id: true }
);

const WarrantySchema = new Schema<VehicleWarranty>(
  {
    months: { type: Number, min: 0, max: 120 },
    km: { type: Number, min: 0, max: 500000 },
    type: { type: String, enum: WARRANTY_TYPES, default: 'NONE' },
  },
  { _id: false }
);

// ---------------- Vehicle ----------------

export interface IVehicle {
  _id: mongoose.Types.ObjectId;
  // Classification
  category: string;
  usageType: string;
  subCategory?: string;
  bodyType?: string;
  // Core
  brand: mongoose.Types.ObjectId;
  brandName: string;
  model: string;
  variant?: string;
  manufacturingYear: number;
  color?: string;
  // Powertrain
  fuelType: string;
  transmission: string;
  bsNorm?: string;
  engineCapacityCc?: number;
  powerBhp?: number;
  torqueNm?: number;
  mileageKmpl?: number;
  batteryCapacityKwh?: number;
  rangeKm?: number;
  // Usage
  kmDriven: number;
  ownerCount: string;
  seats?: number;
  numberOfKeys?: number;
  // Money
  price: number;
  isPriceNegotiable: boolean;
  emiStartingFrom?: number;
  // Content
  description?: string;
  features: string[];
  highlights: string[];
  images: VehicleImage[];
  videoUrl?: string;
  // Listing metadata
  status: string;
  isFeatured: boolean;
  slug: string;
  views: number;
  // Registration & legal (India)
  registrationNumber?: string;
  registrationState: string;
  rtoCode?: string;
  registrationCity?: string;
  registrationType?: string;
  rcAvailable: boolean;
  rcType?: string;
  ownershipTransferStatus?: string;
  roadTax: string;
  roadTaxValidTill?: Date;
  permitType?: string;
  fastagInstalled: boolean;
  chassisNumber?: string;
  engineNumber?: string;
  // Condition & history
  accidentHistory: string;
  floodDamage: boolean;
  serviceHistoryAvailable: boolean;
  lastServiceDate?: Date;
  tyreCondition: string;
  modifications?: string;
  isInspected: boolean;
  inspectionScore?: number;
  inspectionReportUrl?: string;
  warranty: VehicleWarranty;
  // Commercial-specific
  grossVehicleWeightKg?: number;
  payloadCapacityKg?: number;
  unladenWeightKg?: number;
  axleConfiguration?: string;
  numberOfTyres?: number;
  wheelbaseMm?: number;
  bodyLengthFt?: number;
  cabinType?: string;
  tankCapacityLitres?: number;
  seatingCapacity?: number;
  tipperCapacityCubicM?: number;
  hasAc?: boolean;
  hasGpsTelematics?: boolean;
  // Caravan-specific
  sleepingCapacity?: number;
  hasKitchenette?: boolean;
  hasToilet?: boolean;
  hasGenerator?: boolean;
  waterTankLitres?: number;
  solarPanel?: boolean;
  awning?: boolean;
  buildType?: string;
  rtoModificationApproved?: boolean;
  rtoModificationDetails?: string;
  lengthFt?: number;
  widthFt?: number;
  heightFt?: number;
  // Location & seller
  locationState: string;
  locationCity: string;
  locationPincode: string;
  yardName?: string;
  createdBy: mongoose.Types.ObjectId;
  sellerType: string;
  // Tracking
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    // ---- Classification ----
    category: { type: String, required: true, enum: VEHICLE_CATEGORIES, index: true },
    usageType: { type: String, required: true, enum: USAGE_TYPES, index: true },
    subCategory: { type: String, enum: [...COMMERCIAL_SUB_CATEGORIES, null] },
    bodyType: { type: String, enum: [...BODY_TYPES, null], index: true },

    // ---- Core ----
    brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    brandName: { type: String, required: true, trim: true, index: true },
    model: { type: String, required: true, trim: true, index: true },
    variant: { type: String, trim: true },
    manufacturingYear: {
      type: Number,
      required: true,
      min: [1980, 'Manufacturing year must be 1980 or later'],
      max: [new Date().getFullYear() + 1, 'Manufacturing year cannot be in the future'],
    },
    color: { type: String, trim: true, maxlength: 40 },

    // ---- Powertrain ----
    fuelType: { type: String, required: true, enum: FUEL_TYPES, index: true },
    transmission: { type: String, required: true, enum: TRANSMISSIONS, index: true },
    bsNorm: { type: String, enum: [...BS_NORMS, null] },
    engineCapacityCc: { type: Number, min: 0, max: 20000 },
    powerBhp: { type: Number, min: 0, max: 3000 },
    torqueNm: { type: Number, min: 0, max: 10000 },
    mileageKmpl: { type: Number, min: 0, max: 200 },
    batteryCapacityKwh: { type: Number, min: 0, max: 500 },
    rangeKm: { type: Number, min: 0, max: 3000 },

    // ---- Usage ----
    kmDriven: {
      type: Number,
      required: true,
      min: [0, 'Km driven cannot be negative'],
      max: [1000000, 'Km driven looks unrealistic'],
      index: true,
    },
    ownerCount: { type: String, required: true, enum: OWNER_COUNTS },
    seats: { type: Number, min: 1, max: 100 },
    numberOfKeys: { type: Number, min: 0, max: 5 },

    // ---- Money ----
    price: {
      type: Number,
      required: true,
      min: [1000, 'Price must be at least ₹1,000'],
      index: true,
    },
    isPriceNegotiable: { type: Boolean, default: true },
    emiStartingFrom: { type: Number, min: 0 },

    // ---- Content ----
    description: { type: String, trim: true, maxlength: 8000 },
    features: { type: [String], default: [] },
    highlights: { type: [String], default: [] },
    images: { type: [VehicleImageSchema], default: [] },
    videoUrl: { type: String, trim: true },

    // ---- Listing metadata ----
    status: { type: String, enum: VEHICLE_STATUSES, default: 'DRAFT', index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    views: { type: Number, default: 0, min: 0 },

    // ---- Registration & legal ----
    registrationNumber: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    registrationState: { type: String, required: true, trim: true, enum: STATE_VALIDATORS, index: true },
    rtoCode: { type: String, trim: true, uppercase: true, match: [/^[A-Z]{2}[0-9]{1,2}$/, 'Invalid RTO code (e.g. DL01)'] },
    registrationCity: { type: String, trim: true },
    registrationType: { type: String, enum: [...REGISTRATION_TYPES, null] },
    rcAvailable: { type: Boolean, default: true },
    rcType: { type: String, enum: [...RC_TYPES, null] },
    ownershipTransferStatus: { type: String, enum: [...OWNERSHIP_TRANSFER_STATUS, null] },
    roadTax: { type: String, required: true, enum: ROAD_TAX_STATUSES, default: 'LIFETIME' },
    roadTaxValidTill: { type: Date },
    permitType: { type: String, enum: [...PERMIT_TYPES, null] },
    fastagInstalled: { type: Boolean, default: false },
    chassisNumber: { type: String, trim: true, select: false },
    engineNumber: { type: String, trim: true, select: false },

    // ---- Condition & history ----
    accidentHistory: { type: String, required: true, enum: ACCIDENT_HISTORY, default: 'NONE' },
    floodDamage: { type: Boolean, default: false },
    serviceHistoryAvailable: { type: Boolean, default: false },
    lastServiceDate: { type: Date },
    tyreCondition: { type: String, required: true, enum: TYRE_CONDITIONS, default: 'GOOD' },
    modifications: { type: String, trim: true, maxlength: 2000 },
    isInspected: { type: Boolean, default: false, index: true },
    inspectionScore: { type: Number, min: 1, max: 10 },
    inspectionReportUrl: { type: String, trim: true },
    warranty: { type: WarrantySchema, default: () => ({ type: 'NONE' }) },

    // ---- Commercial-specific ----
    grossVehicleWeightKg: { type: Number, min: 0, max: 100000 },
    payloadCapacityKg: { type: Number, min: 0, max: 100000 },
    unladenWeightKg: { type: Number, min: 0, max: 100000 },
    axleConfiguration: { type: String, enum: [...AXLE_CONFIGURATIONS, null] },
    numberOfTyres: { type: Number, min: 2, max: 40 },
    wheelbaseMm: { type: Number, min: 0, max: 10000 },
    bodyLengthFt: { type: Number, min: 0, max: 100 },
    cabinType: { type: String, enum: [...CABIN_TYPES, null] },
    tankCapacityLitres: { type: Number, min: 0, max: 1000 },
    seatingCapacity: { type: Number, min: 1, max: 100 },
    tipperCapacityCubicM: { type: Number, min: 0, max: 50 },
    hasAc: { type: Boolean, default: false },
    hasGpsTelematics: { type: Boolean, default: false },

    // ---- Caravan-specific ----
    sleepingCapacity: { type: Number, min: 0, max: 20 },
    hasKitchenette: { type: Boolean, default: false },
    hasToilet: { type: Boolean, default: false },
    hasGenerator: { type: Boolean, default: false },
    waterTankLitres: { type: Number, min: 0, max: 1000 },
    solarPanel: { type: Boolean, default: false },
    awning: { type: Boolean, default: false },
    buildType: { type: String, trim: true },
    rtoModificationApproved: { type: Boolean, default: false },
    rtoModificationDetails: { type: String, trim: true, maxlength: 1000 },
    lengthFt: { type: Number, min: 0, max: 100 },
    widthFt: { type: Number, min: 0, max: 50 },
    heightFt: { type: Number, min: 0, max: 50 },

    // ---- Location & seller ----
    locationState: { type: String, required: true, trim: true, enum: STATE_VALIDATORS, index: true },
    locationCity: { type: String, required: true, trim: true, index: true },
    locationPincode: {
      type: String,
      required: true,
      trim: true,
      match: [/^[1-8][0-9]{5}$/, 'PIN code must be a valid 6-digit Indian PIN code'],
    },
    yardName: { type: String, trim: true, maxlength: 200 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerType: { type: String, enum: SELLER_TYPES, default: 'INDIVIDUAL' },

    // ---- Tracking ----
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// ---------------- Helpers ----------------

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// Auto-generate slug from brand/model/variant/year/city when not provided
VehicleSchema.pre('validate', function (next) {
  if (this.isNew && !this.slug) {
    const parts = [this.brandName, this.model, this.variant, String(this.manufacturingYear), this.locationCity];
    this.slug = slugify(parts.filter(Boolean).join(' ')).slice(0, 140);
  }
  next();
});

// Enforce exactly one primary image
VehicleSchema.pre('validate', function (next) {
  if (this.images && this.images.length > 0) {
    const primaries = this.images.filter((i) => i.isPrimary);
    if (primaries.length === 0) {
      this.images[0].isPrimary = true;
    } else if (primaries.length > 1) {
      let seen = false;
      this.images.forEach((img) => {
        if (img.isPrimary) {
          if (seen) img.isPrimary = false;
          seen = true;
        }
      });
    }
  }
  next();
});

// ---------------- Indexes ----------------

VehicleSchema.index(
  { brandName: 1, model: 1, variant: 1, manufacturingYear: 1, locationCity: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
VehicleSchema.index(
  { status: 1, isFeatured: 1, createdAt: -1 }
);
VehicleSchema.index({ category: 1, usageType: 1, price: 1 });
VehicleSchema.index({ category: 1, price: 1 });
VehicleSchema.index({ brand: 1, model: 1 });
VehicleSchema.index({ locationState: 1, locationCity: 1 });
VehicleSchema.index({ manufacturingYear: 1 });
VehicleSchema.index({ createdAt: -1 });
VehicleSchema.index(
  {
    brandName: 'text',
    model: 'text',
    variant: 'text',
    description: 'text',
    locationCity: 'text',
    color: 'text',
  },
  { name: 'vehicle_text_search', weights: { brandName: 10, model: 8, variant: 5, locationCity: 3, description: 1 } }
);

const Vehicle: Model<IVehicle> = mongoose.model<IVehicle>('Vehicle', VehicleSchema);

export default Vehicle;
