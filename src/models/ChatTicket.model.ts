/**
 * @file ChatTicket.model.ts
 * @description Mongoose model for live-chat tickets between users and
 *              employees/admins (migrated from the reference support module).
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';
import crypto from 'crypto';
import { CHAT_CATEGORIES, CHAT_PRIORITIES, CHAT_STATUSES } from '../constants/vehicleEnums';

export interface IChatTicket {
  _id: mongoose.Types.ObjectId;
  ticketId: string;
  user: mongoose.Types.ObjectId;
  subject: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  assignedTo?: mongoose.Types.ObjectId;
  relatedVehicle?: mongoose.Types.ObjectId;
  relatedBuyRequest?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  closedAt?: Date;
  lastMessageAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const ChatTicketSchema = new Schema<IChatTicket>(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 4000 },
    category: { type: String, required: true, enum: CHAT_CATEGORIES, default: 'OTHER' },
    priority: { type: String, enum: CHAT_PRIORITIES, default: 'MEDIUM', index: true },
    status: { type: String, enum: CHAT_STATUSES, default: 'OPEN', index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    relatedVehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', index: true },
    relatedBuyRequest: { type: Schema.Types.ObjectId, ref: 'BuyRequest' },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    lastMessageAt: { type: Date },
  },
  { timestamps: true, strict: true }
);

ChatTicketSchema.pre('validate', function (next) {
  if (this.isNew && !this.ticketId) {
    this.ticketId = 'CHAT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  next();
});

ChatTicketSchema.index({ status: 1, createdAt: -1 });
ChatTicketSchema.index({ user: 1, createdAt: -1 });
ChatTicketSchema.index({ assignedTo: 1, status: 1 });

const ChatTicket: Model<IChatTicket> = mongoose.model<IChatTicket>('ChatTicket', ChatTicketSchema);
export default ChatTicket;
