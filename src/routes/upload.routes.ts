/**
 * @file upload.routes.ts
 * @description Generic upload route mounted at /api/v1/uploads.
 * @module Routes
 * @author VehicleMarket Backend
 */

import { Router } from 'express';
import { optionalAuthenticate } from '../middleware/auth.middleware';
import { strictLimiter } from '../middleware/rateLimiter.middleware';
import { uploadFiles } from '../middleware/upload.middleware';
import * as uploadController from '../controllers/upload.controller';

const router = Router();

router.post('/', strictLimiter, optionalAuthenticate, uploadFiles('photo', 6), uploadController.uploadFiles);

export default router;
