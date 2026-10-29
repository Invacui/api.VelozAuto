/**
 * @file sellRequest.routes.ts
 * @description Sell Request routes mounted at /api/v1/sell-requests.
 * @module Routes
 * @author VehicleMarket Backend
 */

import { Router } from 'express';
import validate from '../middleware/validate.middleware';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { strictLimiter } from '../middleware/rateLimiter.middleware';
import * as sellRequestController from '../controllers/sellRequest.controller';
import {
  createSellRequestSchema,
  updateSellRequestSchema,
  convertSellRequestSchema,
  listSellRequestsQuerySchema,
} from '../validators/sellRequest.validator';
import { idParamSchema } from '../validators/common.validator';

const router = Router();

router.post(
  '/',
  strictLimiter,
  optionalAuthenticate,
  validate({ body: createSellRequestSchema }),
  sellRequestController.create
);

router.get('/mine', authenticate, sellRequestController.mine);
router.get('/track', sellRequestController.track);

router.get(
  '/',
  authenticate,
  requireRole('ADMIN', 'EMPLOYEE'),
  validate({ query: listSellRequestsQuerySchema }),
  sellRequestController.list
);

router.get(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'EMPLOYEE'),
  validate({ params: idParamSchema }),
  sellRequestController.getById
);

router.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'EMPLOYEE'),
  validate({ params: idParamSchema, body: updateSellRequestSchema }),
  sellRequestController.update
);

router.post(
  '/:id/convert',
  authenticate,
  requireRole('ADMIN', 'EMPLOYEE'),
  validate({ params: idParamSchema, body: convertSellRequestSchema }),
  sellRequestController.convert
);

export default router;
