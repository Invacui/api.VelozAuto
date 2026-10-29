/**
 * @file buyRequest.routes.ts
 * @description Buy Request routes mounted at /api/v1/buy-requests.
 * @module Routes
 * @author VehicleMarket Backend
 */

import { Router } from 'express';
import validate from '../middleware/validate.middleware';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { strictLimiter } from '../middleware/rateLimiter.middleware';
import * as buyRequestController from '../controllers/buyRequest.controller';
import {
  createBuyRequestSchema,
  updateBuyRequestSchema,
  listBuyRequestsQuerySchema,
} from '../validators/buyRequest.validator';
import { idParamSchema } from '../validators/common.validator';

const router = Router();

router.post(
  '/',
  strictLimiter,
  optionalAuthenticate,
  validate({ body: createBuyRequestSchema }),
  buyRequestController.create
);

router.get('/mine', authenticate, buyRequestController.mine);

router.get(
  '/',
  authenticate,
  requireRole('ADMIN', 'EMPLOYEE'),
  validate({ query: listBuyRequestsQuerySchema }),
  buyRequestController.list
);

router.get(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'EMPLOYEE'),
  validate({ params: idParamSchema }),
  buyRequestController.getById
);

router.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'EMPLOYEE'),
  validate({ params: idParamSchema, body: updateBuyRequestSchema }),
  buyRequestController.update
);

export default router;
