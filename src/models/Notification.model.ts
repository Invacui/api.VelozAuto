/**
 * @file Notification.model.ts
 * @description Mongoose model for admin-facing notifications.
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';
import { NOTIFICATION_TYPES } from '../constants/vehicleEnums';

export interface INotification {
  _id: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  type: string;
  title: string;
  body?: string;
  link?: string;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    type: { type: String, required: true, enum: NOTIFICATION_TYPES, default: 'SYSTEM' },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, trim: true, maxlength: 1000 },
    link: { type: String, trim: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, strict: true }
);

NotificationSchema.index({ createdAt: -1 });

const Notification: Model<INotification> = mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
