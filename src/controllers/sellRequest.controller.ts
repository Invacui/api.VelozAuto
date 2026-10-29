/**
 * @file sellRequest.controller.ts
 * @description Sell Request HTTP handlers.
 * @module Controllers
 * @author VehicleMarket Backend
 */

import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, createdResponse, buildPagination } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { AuthenticatedRequest } from '../types';
import * as sellRequestService from '../services/sellRequest.service';
import { toStaffVehicle } from '../shared/serializers/vehicle.serializer';

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = await sellRequestService.createSellRequest(req.body, req.user?.id);
  createdResponse(res, request, 'Your sell request has been submitted. Our team will review it shortly.');
});

export const mine = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { data, totalItems } = await sellRequestService.getMySellRequests(req.user!.id, req.query);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  successResponse(res, data, 'Your sell requests fetched', 200, buildPagination(page, limit, totalItems));
});

export const track = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const phone = String(req.query.phone || '');
  if (!phone) throw new AppError('A phone number is required to track a request.', 400);
  const { data, totalItems } = await sellRequestService.trackByPhone(phone, req.query);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  successResponse(res, data, 'Sell requests fetched', 200, buildPagination(page, limit, totalItems));
});

export const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status, assignedTo, inspector, q } = req.query as Record<string, any>;
  const filter: Record<string, any> = {};
  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (inspector) filter.inspector = inspector;
  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { phone: new RegExp(q, 'i') }, { registrationNumber: new RegExp(q, 'i') }];
  const { data, totalItems } = await sellRequestService.listSellRequests(filter, req.query);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  successResponse(res, data, 'Sell requests fetched', 200, buildPagination(page, limit, totalItems));
});

export const getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = await sellRequestService.getSellRequestById(req.params.id);
  successResponse(res, request, 'Sell request fetched');
});

export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = await sellRequestService.updateSellRequest(req.params.id, req.body, req.user!.id);
  successResponse(res, request, 'Sell request updated');
});

export const convert = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await sellRequestService.convertToVehicle(req.params.id, req.body.override || {}, req.user!.id);
  createdResponse(
    res,
    {
      sellRequest: result.sellRequest,
      vehicle: toStaffVehicle(result.vehicle),
      slug: result.slug,
    },
    'Sell request converted to a listing'
  );
});

export default { create, mine, track, list, getById, update, convert };
