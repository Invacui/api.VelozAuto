/**
 * @file chatMessage.dao.ts
 * @description Data Access Object for ChatMessage model.
 * @module DAO
 * @author VehicleMarket Backend
 */

import ChatMessage from '../models/ChatMessage.model';
import { PaginationParams } from '../interfaces/request.interface';

export const create = async (data: Record<string, any>) =>
  (await ChatMessage.create(data)).toObject();

export const findByTicket = async (
  ticketId: string,
  pagination: PaginationParams = {}
) => {
  const { page = 1, limit = 100 } = pagination;
  const skip = (page - 1) * limit;
  return ChatMessage.find({ ticket: ticketId })
    .populate('sender', 'name email role profileImage')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countByTicket = async (ticketId: string) =>
  ChatMessage.countDocuments({ ticket: ticketId });

export const markRead = async (ticketId: string, readerId: string) =>
  ChatMessage.updateMany(
    { ticket: ticketId, sender: { $ne: readerId }, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

export const countUnread = async (ticketId: string, readerId: string) =>
  ChatMessage.countDocuments({ ticket: ticketId, sender: { $ne: readerId }, isRead: false });

export default { create, findByTicket, countByTicket, markRead, countUnread };
