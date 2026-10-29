/**
 * @file sellRequest.service.ts
 * @description Sell Request service — seller intake with photos, admin
 *              inspection/offer pipeline, internal notes/assignment and the
 *              one-click conversion of an accepted request into a live Vehicle
 *              listing.
 * @module Services
 * @author VehicleMarket Backend
 */

import * as sellRequestDao from '../dao/sellRequest.dao';
import * as vehicleDao from '../dao/vehicle.dao';
import * as brandDao from '../dao/brand.dao';
import { AppError } from '../utils/AppError';
import { PaginationParams } from '../interfaces/request.interface';
import { sendEmail } from './email.service';
import { sendWhatsAppAcknowledgement } from './whatsapp.service';
import { createAdminNotification } from './notification.service';
import { emitToAdmins } from '../socket/index';
import { TEMPLATE_NAME } from '../constants/emailConstants';
import logger from '../logger/index';

const normalizePhone = (phone: string): string => String(phone).replace(/\D/g, '').slice(-10);

export const createSellRequest = async (data: Record<string, any>, userId?: string) => {
  const methodName = 'createSellRequest';
  logger.info(`${methodName} - entry`, { fileName: 'sellRequest.service.ts', methodName, userId });

  const payload: Record<string, any> = {
    ...data,
    phone: normalizePhone(data.phone),
    user: userId || undefined,
    status: 'SUBMITTED',
    statusHistory: [{ from: null, to: 'SUBMITTED', note: 'Request submitted', by: userId || undefined }],
  };

  const created = await sellRequestDao.create(payload);

  const vehicleLabel =
    `${created.brandName || ''} ${created.model || ''}`.trim() || created.category || 'Vehicle';

  try {
    await createAdminNotification(
      'NEW_SELL_REQUEST',
      'New sell request',
      `${created.name} (${normalizePhone(created.phone)}) wants to sell ${vehicleLabel}`,
      `/admin/sell-requests/${created._id}`
    );
    emitToAdmins('request:new', { type: 'SELL_REQUEST', id: String(created._id) });
  } catch (err: any) {
    logger.error('Failed to emit sell request notification', {
      fileName: 'sellRequest.service.ts',
      methodName,
      error: err.message,
    });
  }

  if (created.email) {
    void sendEmail(created.email, TEMPLATE_NAME.SELL_REQUEST_RECEIVED, {
      name: created.name,
      requestId: String(created._id),
    });
  }

  if (created.phone) {
    void sendWhatsAppAcknowledgement({
      to: created.phone,
      name: created.name,
      message: `we received your request to sell your ${vehicleLabel}. Our inspection team will contact you shortly.`,
      reference: `sell:${created._id}`,
    });
  }

  logger.info(`${methodName} - exit`, { fileName: 'sellRequest.service.ts', methodName, id: created._id });
  return created;
};

export const getMySellRequests = async (
  userId: string,
  pagination: PaginationParams,
  filter: Record<string, any> = {}
) => {
  const data = await sellRequestDao.findByUserId(userId, pagination, filter);
  const totalItems = await sellRequestDao.countAll({ user: userId, ...filter });
  return { data, totalItems };
};

/** Guest tracking by phone (masked, read-only). */
export const trackByPhone = async (phone: string, pagination: PaginationParams = {}) => {
  const normalized = normalizePhone(phone);
  const data = await sellRequestDao.findByPhone(normalized, pagination);
  const totalItems = await sellRequestDao.countAll({ phone: normalized });
  // strip internal fields for guest tracking
  const sanitized = data.map((r: any) => {
    const { internalNotes, ...rest } = r;
    return rest;
  });
  return { data: sanitized, totalItems };
};

export const listSellRequests = async (filter: Record<string, any> = {}, pagination: PaginationParams = {}) => {
  const data = await sellRequestDao.findAll(filter, pagination);
  const totalItems = await sellRequestDao.countAll(filter);
  return { data, totalItems };
};

export const getSellRequestById = async (id: string) => {
  const request = await sellRequestDao.findByIdPopulated(id);
  if (!request) throw new AppError('Sell request not found.', 404);
  return request;
};

export const updateSellRequest = async (
  id: string,
  data: Record<string, any>,
  actorId: string
) => {
  const existing = await sellRequestDao.findById(id);
  if (!existing) throw new AppError('Sell request not found.', 404);

  const { note, internalNote, ...rest } = data;
  const set: Record<string, any> = { ...rest };
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
  if (rest.inspectionDate) set.inspectionDate = rest.inspectionDate;
  if (rest.inspector === '' || rest.inspector === null) set.inspector = null;
  if (rest.assignedTo === '' || rest.assignedTo === null) set.assignedTo = null;
  if (internalNote) {
    pushes.internalNotes = { author: actorId, note: internalNote, at: new Date() };
  }

  const ops: Record<string, any> = { $set: set };
  if (Object.keys(pushes).length) ops.$push = pushes;

  const updated = await sellRequestDao.updateWithOps(id, ops);

  // Offer notification
  if (rest.offerPrice && rest.status === 'OFFER_MADE' && existing.email) {
    void sendEmail(existing.email, TEMPLATE_NAME.SELL_OFFER_MADE, {
      name: existing.name,
      offerPrice: rest.offerPrice,
      requestId: id,
    });
  }

  if (set.status) {
    emitToAdmins('request:updated', { type: 'SELL_REQUEST', id, status: set.status });
  }
  return updated;
};

/**
 * Convert an accepted sell request into a live Vehicle listing.
 * The admin supplies the final price + location/listing fields; everything
 * else is mapped from the sell request's vehicle block.
 */
export const convertToVehicle = async (
  id: string,
  overrides: Record<string, any>,
  actorId: string
) => {
  const request = await sellRequestDao.findByIdPopulated(id);
  if (!request) throw new AppError('Sell request not found.', 404);
  if (request.listedVehicle) {
    throw new AppError('This sell request has already been converted to a listing.', 409);
  }
  if (!overrides.price) {
    throw new AppError('A listing price is required to convert this request.', 422);
  }

  const rawBrand: any = request.brand;
  const brandId = rawBrand ? String(rawBrand._id || rawBrand) : overrides.brand;
  if (!brandId) throw new AppError('A brand is required to create a listing.', 422);
  const brand = await brandDao.findById(brandId);
  if (!brand) throw new AppError('Brand not found.', 404);

  const slugBase = [brand.name, request.model, request.variant, String(request.manufacturingYear), overrides.locationCity || request.city]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 140);

  let slug = slugBase;
  let attempt = 0;
  while (await vehicleDao.findBySlug(slug)) {
    attempt += 1;
    slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;
    if (attempt > 5) slug = `${slugBase}-${Date.now()}`;
  }

  const images = (request.images || []).map((img: any, idx: number) => ({
    url: img.url,
    s3Key: img.s3Key,
    tag: 'EXTERIOR',
    order: idx,
    isPrimary: idx === 0,
  }));

  const vehiclePayload: Record<string, any> = {
    category: request.category,
    usageType: request.usageType,
    subCategory: request.subCategory,
    bodyType: request.bodyType,
    brand: brand._id,
    brandName: brand.name,
    model: request.model,
    variant: request.variant,
    manufacturingYear: request.manufacturingYear,
    color: request.color,
    fuelType: request.fuelType,
    transmission: request.transmission,
    bsNorm: request.bsNorm,
    engineCapacityCc: request.engineCapacityCc,
    powerBhp: request.powerBhp,
    kmDriven: request.kmDriven,
    ownerCount: request.ownerCount,
    seats: request.seats,
    price: overrides.price,
    isPriceNegotiable: overrides.isPriceNegotiable ?? true,
    emiStartingFrom: overrides.emiStartingFrom,
    description: overrides.description || request.description,
    registrationNumber: request.registrationNumber,
    registrationState: request.registrationState,
    rtoCode: request.rtoCode,
    registrationCity: request.registrationCity,
    registrationType: request.registrationType,
    rcAvailable: request.rcAvailable,
    accidentHistory: request.accidentHistory,
    floodDamage: request.floodDamage,
    serviceHistoryAvailable: request.serviceHistoryAvailable,
    tyreCondition: request.tyreCondition,
    grossVehicleWeightKg: request.grossVehicleWeightKg,
    payloadCapacityKg: request.payloadCapacityKg,
    axleConfiguration: request.axleConfiguration,
    numberOfTyres: request.numberOfTyres,
    locationState: overrides.locationState || request.registrationState,
    locationCity: overrides.locationCity || request.city,
    locationPincode: overrides.locationPincode || request.pincode,
    yardName: overrides.yardName,
    images,
    slug,
    status: overrides.status || 'DRAFT',
    isFeatured: false,
    createdBy: actorId,
  };

  const created = await vehicleDao.create(vehiclePayload);

  const updated = await sellRequestDao.updateWithOps(id, {
    $set: { status: 'LISTED', listedVehicle: created._id },
    $push: {
      statusHistory: {
        from: request.status,
        to: 'LISTED',
        note: 'Converted to a listing',
        by: actorId,
        at: new Date(),
      },
    },
  });

  if (request.email) {
    void sendEmail(request.email, TEMPLATE_NAME.SELL_LISTED, {
      name: request.name,
      requestId: id,
    });
  }

  logger.info('Sell request converted to listing', {
    fileName: 'sellRequest.service.ts',
    methodName: 'convertToVehicle',
    sellRequestId: id,
    vehicleId: String(created._id),
  });

  return { sellRequest: updated, vehicle: created, slug };
};

export default {
  createSellRequest,
  getMySellRequests,
  trackByPhone,
  listSellRequests,
  getSellRequestById,
  updateSellRequest,
  convertToVehicle,
};
