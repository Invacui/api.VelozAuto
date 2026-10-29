/**
 * @file chatTicket.dao.ts
 * @description Data Access Object for ChatTicket model.
 * @module DAO
 * @author VehicleMarket Backend
 */

import ChatTicket from '../models/ChatTicket.model';
import { PaginationParams } from '../interfaces/request.interface';

export const create = async (data: Record<string, any>) =>
  (await ChatTicket.create(data)).toObject();

export const findById = async (id: string) => ChatTicket.findById(id).lean();

export const findByTicketId = async (ticketId: string) => ChatTicket.findOne({ ticketId }).lean();

export const findByIdPopulated = async (id: string) =>
  ChatTicket.findById(id)
    .populate('user', 'name email phone profileImage')
    .populate('assignedTo', 'name email')
    .populate('relatedVehicle', 'brandName model variant slug price images')
    .lean();

export const findTicketsForUser = async (userId: string, role: string) => {
  const filter = role === 'ADMIN' || role === 'EMPLOYEE' ? {} : { user: userId };
  return ChatTicket.find(filter).select('_id ticketId').lean();
};

export const findByUser = async (userId: string, pagination: PaginationParams = {}) => {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;
  return ChatTicket.find({ user: userId })
    .sort({ lastMessageAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const findAll = async (
  filter: Record<string, any> = {},
  pagination: PaginationParams = {}
) => {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;
  return ChatTicket.find(filter)
    .populate('user', 'name email phone profileImage')
    .populate('assignedTo', 'name email')
    .sort({ lastMessageAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

export const countAll = async (filter: Record<string, any> = {}) =>
  ChatTicket.countDocuments(filter);

export const countOpen = async () =>
  ChatTicket.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } });

export const updateById = async (id: string, data: Record<string, any>) =>
  ChatTicket.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean();

export default {
  create,
  findById,
  findByTicketId,
  findByIdPopulated,
  findTicketsForUser,
  findByUser,
  findAll,
  countAll,
  countOpen,
  updateById,
};
