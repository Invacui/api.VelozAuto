/**
 * @file wishlist.routes.ts
 * @description Wishlist routes mounted at /api/v1/wishlist.
 * @module Routes
 * @author VehicleMarket Backend
 */

import { Router } from 'express';
import validate from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import * as wishlistController from '../controllers/wishlist.controller';
import { vehicleIdParamSchema } from '../validators/wishlist.validator';
import { paginationSchema } from '../validators/common.validator';
import Joi from 'joi';

const router = Router();

router.use(authenticate);
router.get('/', validate({ query: Joi.object({ ...paginationSchema }) }), wishlistController.list);
router.post('/:vehicleId', validate({ params: vehicleIdParamSchema }), wishlistController.add);
router.delete('/:vehicleId', validate({ params: vehicleIdParamSchema }), wishlistController.remove);

export default router;
