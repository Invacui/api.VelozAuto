/**
 * @file SeoSetting.model.ts
 * @description Per-page SEO metadata managed from the admin dashboard.
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface ISeoSetting {
  _id: mongoose.Types.ObjectId;
  path: string;
  title?: string;
  description?: string;
  keywords: string[];
  ogImage?: string;
  canonical?: string;
  noindex: boolean;
  jsonLd?: Record<string, any>;
  lastmod?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const SeoSettingSchema = new Schema<ISeoSetting>(
  {
    path: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    title: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 400 },
    keywords: { type: [String], default: [] },
    ogImage: { type: String, trim: true },
    canonical: { type: String, trim: true },
    noindex: { type: Boolean, default: false },
    jsonLd: { type: Schema.Types.Mixed },
    lastmod: { type: Date, default: Date.now },
  },
  { timestamps: true, strict: true }
);

const SeoSetting: Model<ISeoSetting> = mongoose.model<ISeoSetting>('SeoSetting', SeoSettingSchema);
export default SeoSetting;
