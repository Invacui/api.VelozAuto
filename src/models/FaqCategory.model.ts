/**
 * @file FaqCategory.model.ts
 * @description Mongoose model for FAQ categories.
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface IFaqCategory {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const FaqCategorySchema = new Schema<IFaqCategory>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, trim: true, maxlength: 1000 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: true }
);

FaqCategorySchema.pre('validate', function (next) {
  if (this.isNew && !this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  next();
});

const FaqCategory: Model<IFaqCategory> = mongoose.model<IFaqCategory>('FaqCategory', FaqCategorySchema);
export default FaqCategory;
