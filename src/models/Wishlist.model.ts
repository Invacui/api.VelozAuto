/**
 * @file Wishlist.model.ts
 * @description Mongoose model for per-user saved vehicles.
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface IWishlist {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  vehicle: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
  },
  {
    timestamps: true,
    strict: true,
  }
);

WishlistSchema.index({ user: 1, vehicle: 1 }, { unique: true });

const Wishlist: Model<IWishlist> = mongoose.model<IWishlist>('Wishlist', WishlistSchema);

export default Wishlist;
