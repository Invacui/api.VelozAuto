/**
 * @file Contact.model.ts
 * @description Mongoose model for contact-form submissions.
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';
import { CONTACT_STATUSES } from '../constants/vehicleEnums';
import { isValidIndianPhone, normalizeIndianPhone } from '../shared/helpers/indian.helper';

export interface IContact {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  adminNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: (v: string) => !v || isValidIndianPhone(v),
        message: 'Phone must be a valid 10-digit Indian mobile number',
      },
      set: (v: string) => (v ? normalizeIndianPhone(v) : v),
    },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    status: { type: String, enum: CONTACT_STATUSES, default: 'NEW', index: true },
    adminNotes: { type: String, trim: true, maxlength: 4000 },
  },
  { timestamps: true, strict: true }
);

const Contact: Model<IContact> = mongoose.model<IContact>('Contact', ContactSchema);
export default Contact;
