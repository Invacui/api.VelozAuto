/**
 * @file FaqArticle.model.ts
 * @description Mongoose model for FAQ articles.
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface IFaqArticle {
  _id: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const FaqArticleSchema = new Schema<IFaqArticle>(
  {
    category: { type: Schema.Types.ObjectId, ref: 'FaqCategory', required: true, index: true },
    question: { type: String, required: true, trim: true, maxlength: 500 },
    answer: { type: String, required: true, trim: true, maxlength: 8000 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: true }
);

const FaqArticle: Model<IFaqArticle> = mongoose.model<IFaqArticle>('FaqArticle', FaqArticleSchema);
export default FaqArticle;
