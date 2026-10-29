/**
 * @file chat.controller.ts
 * @description Live chat HTTP handlers (tickets + messages).
 * @module Controllers
 * @author VehicleMarket Backend
 */

import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, createdResponse, buildPagination } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';
import * as chatService from '../services/chat.service';

const requester = (req: AuthenticatedRequest) => ({ id: req.user!.id, role: req.user!.role });

export const createTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ticket = await chatService.createTicket(req.user!.id, req.body);
  createdResponse(res, ticket, 'Conversation started');
});

export const myTickets = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { data, totalItems } = await chatService.getMyTickets(req.user!.id, req.query);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  successResponse(res, data, 'Conversations fetched', 200, buildPagination(page, limit, totalItems));
});

export const listTickets = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status, assignedTo, priority, q } = req.query as Record<string, any>;
  const filter: Record<string, any> = {};
  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (priority) filter.priority = priority;
  if (q) filter.$or = [{ subject: new RegExp(q, 'i') }, { ticketId: new RegExp(q, 'i') }];
  const { data, totalItems } = await chatService.listTickets(filter, req.query);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  successResponse(res, data, 'Conversations fetched', 200, buildPagination(page, limit, totalItems));
});

export const getTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ticket = await chatService.getTicket(req.params.id, requester(req));
  successResponse(res, ticket, 'Conversation fetched');
});

export const updateTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ticket = await chatService.updateTicket(req.params.id, req.body);
  successResponse(res, ticket, 'Conversation updated');
});

export const getMessages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { data, totalItems } = await chatService.getMessages(req.params.id, requester(req), req.query);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 100;
  successResponse(res, data, 'Messages fetched', 200, buildPagination(page, limit, totalItems));
});

export const sendMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const msg = await chatService.sendMessage(req.params.id, requester(req), req.body.message, req.body.imageUrl);
  createdResponse(res, msg, 'Message sent');
});

export const sendImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const msg = await chatService.sendImage(
    req.params.id,
    requester(req),
    req.file as Express.Multer.File,
    req.body.caption
  );
  createdResponse(res, msg, 'Image sent');
});

export const markRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await chatService.markRead(req.params.id, requester(req));
  successResponse(res, result, 'Conversation marked read');
});

export default {
  createTicket,
  myTickets,
  listTickets,
  getTicket,
  updateTicket,
  getMessages,
  sendMessage,
  sendImage,
  markRead,
};
