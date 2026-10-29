/**
 * @file chat.routes.ts
 * @description Live chat routes mounted at /api/v1/chat.
 * @module Routes
 * @author VehicleMarket Backend
 */

import { Router } from 'express';
import validate from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { upload } from '../middleware/upload.middleware';
import * as chatController from '../controllers/chat.controller';
import {
  createTicketSchema,
  updateTicketSchema,
  sendMessageSchema,
  listTicketsQuerySchema,
} from '../validators/chat.validator';
import { idParamSchema } from '../validators/common.validator';

const router = Router();
const staff = [authenticate, requireRole('ADMIN')];

router.use(authenticate);

router.post('/tickets', validate({ body: createTicketSchema }), chatController.createTicket);
router.get('/tickets/mine', chatController.myTickets);
router.get('/tickets', ...staff, validate({ query: listTicketsQuerySchema }), chatController.listTickets);

router.get('/tickets/:id', validate({ params: idParamSchema }), chatController.getTicket);
router.patch('/tickets/:id', ...staff, validate({ params: idParamSchema, body: updateTicketSchema }), chatController.updateTicket);
router.get('/tickets/:id/messages', validate({ params: idParamSchema }), chatController.getMessages);
router.post('/tickets/:id/messages', validate({ params: idParamSchema, body: sendMessageSchema }), chatController.sendMessage);
router.post('/tickets/:id/messages/image', upload('photo'), chatController.sendImage);
router.patch('/tickets/:id/read', validate({ params: idParamSchema }), chatController.markRead);

export default router;
