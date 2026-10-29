/**
 * @file vehicle.routes.ts
 * @description Vehicle routes mounted at /api/v1/vehicles.
 * @module Routes
 * @author VehicleMarket Backend
 */

import { Router } from 'express';
import validate from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { uploadFiles } from '../middleware/upload.middleware';
import * as vehicleController from '../controllers/vehicle.controller';
import {
  createVehicleSchema,
  updateVehicleSchema,
  updateVehicleStatusSchema,
  listVehiclesQuerySchema,
  adminListVehiclesQuerySchema,
  similarVehiclesQuerySchema,
  addImagesByUrlSchema,
} from '../validators/vehicle.validator';
import { slugParamSchema, idParamSchema } from '../validators/common.validator';
import Joi from 'joi';

const router = Router();

const imageIdParamSchema = Joi.object({
  id: Joi.string().length(24).hex().required(),
  imageId: Joi.string().length(24).hex().required(),
});

// ---- Public ----
router.get('/', validate({ query: listVehiclesQuerySchema }), vehicleController.listVehicles);
router.get('/featured', vehicleController.getFeatured);
router.get('/filters-meta', vehicleController.getFiltersMeta);
router.get('/slug/:slug', validate({ params: slugParamSchema }), vehicleController.getBySlug);
router.get('/:id/similar', validate({ params: idParamSchema, query: similarVehiclesQuerySchema }), vehicleController.getSimilar);

// ---- Admin / Employee ----
router.get(
  '/admin/all',
  authenticate,
  requireRole('ADMIN', 'EMPLOYEE'),
  validate({ query: adminListVehiclesQuerySchema }),
  vehicleController.adminList
);
router.get(
  '/admin/:id',
  authenticate,
  requireRole('ADMIN', 'EMPLOYEE'),
  validate({ params: idParamSchema }),
  vehicleController.adminGetById
);
router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'EMPLOYEE'),
  validate({ body: createVehicleSchema }),
  vehicleController.create
);
router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'EMPLOYEE'),
  validate({ params: idParamSchema, body: updateVehicleSchema }),
  vehicleController.update
);
router.patch(
  '/:id/status',
  authenticate,
  requireRole('ADMIN', 'EMPLOYEE'),
  validate({ params: idParamSchema, body: updateVehicleStatusSchema }),
  vehicleController.updateStatus
);
router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'EMPLOYEE'),
  validate({ params: idParamSchema }),
  vehicleController.remove
);
router.post(
  '/:id/images',
  authenticate,
  requireRole('ADMIN', 'EMPLOYEE'),
  uploadFiles('photo', 15),
  vehicleController.addImages
);
router.post(
  '/:id/images/urls',
  authenticate,
  requireRole('ADMIN', 'EMPLOYEE'),
  validate({ params: idParamSchema, body: addImagesByUrlSchema }),
  vehicleController.addImagesByUrl
);
router.delete(
  '/:id/images/:imageId',
  authenticate,
  requireRole('ADMIN', 'EMPLOYEE'),
  validate({ params: imageIdParamSchema }),
  vehicleController.removeImage
);

// ---- Public id lookup (must come last to avoid clashing with named routes) ----
router.get('/:id', validate({ params: idParamSchema }), vehicleController.getById);

export default router;
