/**
 * @file buyRequest.service.ts
 * @description Buy Request service — guest/registered request intake with a
 *              duplicate spam window, admin pipeline transitions, assignment
 *              and internal notes, plus notification/email fan-out.
 * @module Services
 * @author VehicleMarket Backend
 */

import * as buyRequestDao from '../dao/buyRequest.dao';
import * as vehicleDao from '../dao/vehicle.dao';
import * as userDao from '../dao/user.dao';
import { AppError } from '../utils/AppError';
import { PaginationParams } from '../interfaces/request.interface';
import { sendEmail } from './email.service';
import { sendWhatsAppAcknowledgement } from './whatsapp.service';
import { createAdminNotification } from './notification.service';
import { emitToAdmins } from '../socket/index';
import { TEMPLATE_NAME } from '../constants/emailConstants';
import logger from '../logger/index';

/** Duplicate guard window: one request per phone+vehicle per 24h. */
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

const normalizePhone = (phone: string): string => String(phone).replace(/\D/g, '').slice(-10);

export const createBuyRequest = async (data: Record<string, any>, userId?: string) => {
  const methodName = 'createBuyRequest';
  logger.info(`${methodName} - entry`, { fileName: 'buyRequest.service.ts', methodName, userId });

  const vehicle = await vehicleDao.findById(data.vehicle);
  if (!vehicle || vehicle.deletedAt) throw new AppError('Vehicle not found.', 404);

  const phone = normalizePhone(data.phone);
  const duplicate = await buyRequestDao.findRecentDuplicate(phone, data.vehicle, DUPLICATE_WINDOW_MS);
  if (duplicate) {
    throw new AppError(
      'You already submitted a request for this vehicle recently. Our team will contact you soon.',
      409
    );
  }

  const payload: Record<string, any> = {
    ...data,
    phone,
    user: userId || undefined,
    status: 'NEW',
    statusHistory: [{ from: null, to: 'NEW', note: 'Request submitted', by: userId || undefined }],
  };

  const created = await buyRequestDao.create(payload);

  const vehicleLabel = `${vehicle.brandName || ''} ${vehicle.model || ''} ${vehicle.variant || ''}`.trim();

  // Fire-and-forget notifications
  try {
    await createAdminNotification(
      'NEW_BUY_REQUEST',
      'New buy request',
      `${created.name} (${phone}) is interested in ${vehicleLabel}`,
      `/admin/buy-requests/${created._id}`
    );
    emitToAdmins('request:new', { type: 'BUY_REQUEST', id: String(created._id), vehicle: vehicleLabel });
  } catch (err: any) {
    logger.error('Failed to emit buy request notification', {
      fileName: 'buyRequest.service.ts',
      methodName,
      error: err.message,
    });
  }

  if (created.email) {
    void sendEmail(created.email, TEMPLATE_NAME.BUY_REQUEST_RECEIVED, {
      name: created.name,
      vehicle: vehicleLabel,
      requestId: String(created._id),
    });
  }

  if (created.phone) {
    void sendWhatsAppAcknowledgement({
      to: created.phone,
      name: created.name,
      message: `we received your enquiry for the ${vehicleLabel}. Our team will contact you shortly.`,
      reference: `buy:${created._id}`,
    });
  }

  logger.info(`${methodName} - exit`, { fileName: 'buyRequest.service.ts', methodName, id: created._id });
  return created;
};

export const getMyBuyRequests = async (userId: string, pagination: PaginationParams, filter: Record<string, any> = {}) => {
  const data = await buyRequestDao.findByUserId(userId, pagination, filter);
  const totalItems = await buyRequestDao.countAll({ user: userId, ...filter });
  return { data, totalItems };
};

export const listBuyRequests = async (filter: Record<string, any> = {}, pagination: PaginationParams = {}) => {
  const data = await buyRequestDao.findAll(filter, pagination);
  const totalItems = await buyRequestDao.countAll(filter);
  return { data, totalItems };
};

export const getBuyRequestById = async (id: string) => {
  const request = await buyRequestDao.findByIdPopulated(id);
  if (!request) throw new AppError('Buy request not found.', 404);
  return request;
};

export const updateBuyRequest = async (
  id: string,
  data: Record<string, any>,
  actorId: string
) => {
  const existing = await buyRequestDao.findById(id);
  if (!existing) throw new AppError('Buy request not found.', 404);

  const { note, internalNote, ...rest } = data;
  const set: Record<string, any> = { ...rest };
  const ops: Record<string, any> = { $set: set };
  const pushes: Record<string, any> = {};

  if (rest.status && rest.status !== existing.status) {
    pushes.statusHistory = {
      from: existing.status,
      to: rest.status,
      note: note || `Status changed to ${rest.status}`,
      by: actorId,
      at: new Date(),
    };
  }
  if (internalNote) {
    pushes.internalNotes = { author: actorId, note: internalNote, at: new Date() };
  }
  if (Object.keys(pushes).length) ops.$push = pushes;

  if (rest.assignedTo === '' || rest.assignedTo === null) set.assignedTo = null;

  const updated = await buyRequestDao.updateWithOps(id, ops);

  if (set.status) {
    emitToAdmins('request:updated', { type: 'BUY_REQUEST', id, status: set.status });
  }
  return updated;
};

export default {
  createBuyRequest,
  getMyBuyRequests,
  listBuyRequests,
  getBuyRequestById,
  updateBuyRequest,
};
