/**
 * @file buyRequest.controller.ts
 * @description Buy Request HTTP handlers.
 * @module Controllers
 * @author VehicleMarket Backend
 */

import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, createdResponse, buildPagination } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';
import * as buyRequestService from '../services/buyRequest.service';

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = await buyRequestService.createBuyRequest(req.body, req.user?.id);
  createdResponse(res, request, 'Your request has been submitted. Our team will contact you shortly.');
});

export const mine = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { data, totalItems } = await buyRequestService.getMyBuyRequests(req.user!.id, req.query);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  successResponse(res, data, 'Your buy requests fetched', 200, buildPagination(page, limit, totalItems));
});

export const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status, vehicle, assignedTo, q } = req.query as Record<string, any>;
  const filter: Record<string, any> = {};
  if (status) filter.status = status;
  if (vehicle) filter.vehicle = vehicle;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { phone: new RegExp(q, 'i') }];
  const { data, totalItems } = await buyRequestService.listBuyRequests(filter, req.query);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  successResponse(res, data, 'Buy requests fetched', 200, buildPagination(page, limit, totalItems));
});

export const getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = await buyRequestService.getBuyRequestById(req.params.id);
  successResponse(res, request, 'Buy request fetched');
});

export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const request = await buyRequestService.updateBuyRequest(req.params.id, req.body, req.user!.id);
  successResponse(res, request, 'Buy request updated');
});

export default { create, mine, list, getById, update };
