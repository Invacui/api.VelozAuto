/**
 * @file BuyRequest.model.ts
 * @description Mongoose model for BuyRequest — "I'm interested in this
 *              vehicle". Tracks the sales workflow from NEW to CLOSED_WON /
 *              CLOSED_LOST with assignment, internal notes and a status log.
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';
import { BUDGET_RANGES, BUY_REQUEST_STATUSES } from '../constants/vehicleEnums';
import { isValidIndianPhone, normalizeIndianPhone } from '../shared/helpers/indian.helper';

export interface StatusHistoryEntry {
  from: string;
  to: string;
  note?: string;
  by?: mongoose.Types.ObjectId;
  at: Date;
}

export interface InternalNote {
  _id?: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  note: string;
  at: Date;
}

export interface IBuyRequest {
  _id: mongoose.Types.ObjectId;
  vehicle: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  budget?: string;
  needsFinance: boolean;
  wantsTestDrive: boolean;
  testDriveDate?: Date;
  hasExchangeVehicle: boolean;
  exchangeDetails?: string;
  message?: string;
  status: string;
  assignedTo?: mongoose.Types.ObjectId;
  internalNotes: InternalNote[];
  statusHistory: StatusHistoryEntry[];
  createdAt?: Date;
  updatedAt?: Date;
}

const StatusHistorySchema = new Schema<StatusHistoryEntry>(
  {
    from: { type: String, default: null },
    to: { type: String, required: true },
    note: { type: String, trim: true, maxlength: 1000 },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const InternalNoteSchema = new Schema<InternalNote>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, required: true, trim: true, maxlength: 2000 },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const BuyRequestSchema = new Schema<IBuyRequest>(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
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
    budget: { type: String, enum: [...BUDGET_RANGES, null] },
    needsFinance: { type: Boolean, default: false },
    wantsTestDrive: { type: Boolean, default: false },
    testDriveDate: { type: Date },
    hasExchangeVehicle: { type: Boolean, default: false },
    exchangeDetails: { type: String, trim: true, maxlength: 2000 },
    message: { type: String, trim: true, maxlength: 2000 },
    status: { type: String, enum: BUY_REQUEST_STATUSES, default: 'NEW', index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    internalNotes: { type: [InternalNoteSchema], default: [] },
    statusHistory: { type: [StatusHistorySchema], default: [] },
  },
  {
    timestamps: true,
    strict: true,
  }
);

BuyRequestSchema.index({ vehicle: 1, createdAt: -1 });
BuyRequestSchema.index({ status: 1, createdAt: -1 });
BuyRequestSchema.index({ user: 1, createdAt: -1 });
BuyRequestSchema.index({ phone: 1, vehicle: 1, createdAt: -1 });

const BuyRequest: Model<IBuyRequest> = mongoose.model<IBuyRequest>('BuyRequest', BuyRequestSchema);

export default BuyRequest;
