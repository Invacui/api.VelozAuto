/**
 * @file master.routes.ts
 * @description Master data routes mounted at /api/v1/master.
 * @module Routes
 * @author VehicleMarket Backend
 */

import { Router } from 'express';
import validate from '../middleware/validate.middleware';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import * as masterController from '../controllers/master.controller';
import {
  createBrandSchema, updateBrandSchema,
  createModelSchema, updateModelSchema,
  createLocationSchema, updateLocationSchema,
  createFeatureSchema, updateFeatureSchema,
  listMasterQuerySchema,
} from '../validators/master.validator';
import { idParamSchema } from '../validators/common.validator';

const router = Router();
const staff = [authenticate, requireRole('ADMIN', 'EMPLOYEE')];

// ---- Public catalogue reads ----
router.get('/brands', optionalAuthenticate, validate({ query: listMasterQuerySchema }), masterController.listBrands);
router.get('/models', validate({ query: listMasterQuerySchema }), masterController.listModels);
router.get('/locations', validate({ query: listMasterQuerySchema }), masterController.listLocations);
router.get('/features', validate({ query: listMasterQuerySchema }), masterController.listFeatures);

// ---- Admin CRUD ----
router.post('/brands', ...staff, validate({ body: createBrandSchema }), masterController.createBrand);
router.put('/brands/:id', ...staff, validate({ params: idParamSchema, body: updateBrandSchema }), masterController.updateBrand);
router.delete('/brands/:id', ...staff, validate({ params: idParamSchema }), masterController.deleteBrand);

router.post('/models', ...staff, validate({ body: createModelSchema }), masterController.createModel);
router.put('/models/:id', ...staff, validate({ params: idParamSchema, body: updateModelSchema }), masterController.updateModel);
router.delete('/models/:id', ...staff, validate({ params: idParamSchema }), masterController.deleteModel);

router.post('/locations', ...staff, validate({ body: createLocationSchema }), masterController.createLocation);
router.put('/locations/:id', ...staff, validate({ params: idParamSchema, body: updateLocationSchema }), masterController.updateLocation);
router.delete('/locations/:id', ...staff, validate({ params: idParamSchema }), masterController.deleteLocation);

router.post('/features', ...staff, validate({ body: createFeatureSchema }), masterController.createFeature);
router.put('/features/:id', ...staff, validate({ params: idParamSchema, body: updateFeatureSchema }), masterController.updateFeature);
router.delete('/features/:id', ...staff, validate({ params: idParamSchema }), masterController.deleteFeature);

export default router;
