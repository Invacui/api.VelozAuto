/**
 * @file ChatMessage.model.ts
 * @description Mongoose model for chat messages within a ticket.
 * @module Models
 * @author VehicleMarket Backend
 */

import mongoose, { Schema, Model } from 'mongoose';
import { SENDER_ROLES } from '../constants/vehicleEnums';

export interface IChatMessage {
  _id: mongoose.Types.ObjectId;
  ticket: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  senderRole: string;
  message: string;
  imageUrl?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    ticket: { type: Schema.Types.ObjectId, ref: 'ChatTicket', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, required: true, enum: SENDER_ROLES },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    imageUrl: { type: String, trim: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true, strict: true }
);

ChatMessageSchema.index({ ticket: 1, createdAt: 1 });

const ChatMessage: Model<IChatMessage> = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
export default ChatMessage;
