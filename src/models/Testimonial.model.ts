/**
 * @file Testimonial.model.ts
 * @description Mongoose model for customer testimonials.
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface ITestimonial {
  _id: mongoose.Types.ObjectId;
  name: string;
  city?: string;
  role?: string;
  quote: string;
  rating: number;
  avatar?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    city: { type: String, trim: true, maxlength: 100 },
    role: { type: String, trim: true, maxlength: 120 },
    quote: { type: String, required: true, trim: true, maxlength: 2000 },
    rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    avatar: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, strict: true }
);

const Testimonial: Model<ITestimonial> = mongoose.model<ITestimonial>('Testimonial', TestimonialSchema);
export default Testimonial;
