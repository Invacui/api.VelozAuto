/**
 * @file chat.service.ts
 * @description Live chat service — tickets and messages, with socket.io
 *              fan-out to ticket rooms, users and admins.
 * @module Services
 * @author VehicleMarket Backend
 */

import * as chatTicketDao from '../dao/chatTicket.dao';
import * as chatMessageDao from '../dao/chatMessage.dao';
import { AppError } from '../utils/AppError';
import { PaginationParams } from '../interfaces/request.interface';
import { emitToUser, emitToAdmins, emitToTicketRoom } from '../socket/index';
import { createAdminNotification } from './notification.service';
import { uploadChatImage } from './upload.service';
import { isStaff } from '../shared/helpers/roles.helper';
import logger from '../logger/index';
import { UserRole } from '../types';

export const createTicket = async (userId: string, data: Record<string, any>) => {
  const ticket = await chatTicketDao.create({
    user: userId,
    subject: data.subject,
    description: data.description,
    category: data.category || 'OTHER',
    priority: data.priority || 'MEDIUM',
    relatedVehicle: data.relatedVehicle || undefined,
    relatedBuyRequest: data.relatedBuyRequest || undefined,
    status: 'OPEN',
  });

  try {
    await createAdminNotification(
      'NEW_CHAT_TICKET',
      'New chat ticket',
      `${ticket.subject}`,
      `/admin/chat/${ticket._id}`
    );
    emitToAdmins('ticket:new', { id: String(ticket._id), subject: ticket.subject });
  } catch (err: any) {
    logger.error('Failed to emit chat ticket notification', {
      fileName: 'chat.service.ts',
      methodName: 'createTicket',
      error: err.message,
    });
  }
  return ticket;
};

export const getMyTickets = async (userId: string, pagination: PaginationParams = {}) => {
  const data = await chatTicketDao.findByUser(userId, pagination);
  const totalItems = await chatTicketDao.countAll({ user: userId });
  return { data, totalItems };
};

export const listTickets = async (filter: Record<string, any> = {}, pagination: PaginationParams = {}) => {
  const data = await chatTicketDao.findAll(filter, pagination);
  const totalItems = await chatTicketDao.countAll(filter);
  return { data, totalItems };
};

export const getTicket = async (id: string, requester: { id: string; role: UserRole }) => {
  const ticket = await chatTicketDao.findByIdPopulated(id);
  if (!ticket) throw new AppError('Chat ticket not found.', 404);
  if (!isStaff(requester.role) && String((ticket.user as any)._id) !== requester.id) {
    throw new AppError('You do not have access to this conversation.', 403);
  }
  return ticket;
};

export const updateTicket = async (id: string, data: Record<string, any>) => {
  const existing = await chatTicketDao.findById(id);
  if (!existing) throw new AppError('Chat ticket not found.', 404);

  const patch: Record<string, any> = { ...data };
  if (patch.assignedTo === '' || patch.assignedTo === null) patch.assignedTo = null;
  if (patch.status === 'RESOLVED') patch.resolvedAt = new Date();
  if (patch.status === 'CLOSED') patch.closedAt = new Date();

  const updated = await chatTicketDao.updateById(id, patch);
  emitToTicketRoom(id, 'ticket_updated', updated);
  return updated;
};

export const getMessages = async (id: string, requester: { id: string; role: UserRole }, pagination: PaginationParams = {}) => {
  await getTicket(id, requester); // access check
  const data = await chatMessageDao.findByTicket(id, pagination);
  const totalItems = await chatMessageDao.countByTicket(id);
  return { data, totalItems };
};

export const sendMessage = async (
  id: string,
  sender: { id: string; role: UserRole },
  message: string,
  imageUrl?: string
) => {
  const ticket = await chatTicketDao.findById(id);
  if (!ticket) throw new AppError('Chat ticket not found.', 404);
  if (!isStaff(sender.role) && String(ticket.user) !== sender.id) {
    throw new AppError('You do not have access to this conversation.', 403);
  }

  const msg = await chatMessageDao.create({
    ticket: id,
    sender: sender.id,
    senderRole: sender.role,
    message: message || (imageUrl ? '[image]' : ''),
    imageUrl,
    isRead: false,
  });

  await chatTicketDao.updateById(id, { lastMessageAt: new Date() });

  // Fan out: everyone in the room, plus the counterpart, plus admins when a user writes
  emitToTicketRoom(id, 'new_message', msg);
  if (isStaff(sender.role)) {
    emitToUser(String(ticket.user), 'new_message', msg);
  } else {
    emitToAdmins('new_message', { ticketId: id, message: msg });
  }
  return msg;
};

export const sendImage = async (
  id: string,
  sender: { id: string; role: UserRole },
  file: Express.Multer.File,
  caption?: string
) => {
  const ticket = await chatTicketDao.findById(id);
  if (!ticket) throw new AppError('Chat ticket not found.', 404);
  const { url } = await uploadChatImage(id, file);
  return sendMessage(id, sender, caption || '[image]', url);
};

export const markRead = async (id: string, reader: { id: string; role: string }) => {
  const ticket = await chatTicketDao.findById(id);
  if (!ticket) throw new AppError('Chat ticket not found.', 404);
  await chatMessageDao.markRead(id, reader.id);
  emitToTicketRoom(id, 'ticket:read', { ticketId: id, by: reader.id });
  return { ticketId: id, read: true };
};

export default {
  createTicket,
  getMyTickets,
  listTickets,
  getTicket,
  updateTicket,
  getMessages,
  sendMessage,
  sendImage,
  markRead,
};
