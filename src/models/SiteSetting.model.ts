/**
 * @file SiteSetting.model.ts
 * @description Singleton site-wide settings (contact info, socials, defaults).
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface ISiteSetting {
  _id: mongoose.Types.ObjectId;
  siteName: string;
  tagline?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  workingHours?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  defaultMeta: { title?: string; description?: string; image?: string };
  footerText?: string;
  termsContent?: string;
  privacyContent?: string;
  legalUpdatedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const SiteSettingSchema = new Schema<ISiteSetting>(
  {
    siteName: { type: String, required: true, default: 'VehicleMarket', trim: true },
    tagline: { type: String, trim: true, maxlength: 300 },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    whatsapp: { type: String, trim: true },
    address: { type: String, trim: true, maxlength: 500 },
    workingHours: { type: String, trim: true, maxlength: 200 },
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    twitter: { type: String, trim: true },
    youtube: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    defaultMeta: {
      type: new Schema(
        {
          title: { type: String, trim: true },
          description: { type: String, trim: true },
          image: { type: String, trim: true },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    footerText: { type: String, trim: true, maxlength: 1000 },
    termsContent: { type: String, maxlength: 100000 },
    privacyContent: { type: String, maxlength: 100000 },
    legalUpdatedAt: { type: Date },
  },
  { timestamps: true, strict: true }
);

const SiteSetting: Model<ISiteSetting> = mongoose.model<ISiteSetting>('SiteSetting', SiteSettingSchema);
export default SiteSetting;
