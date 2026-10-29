/**
 * @file sitemap.routes.ts
 * @description Sitemap route.
 * @module Routes
 * @author VehicleMarket Backend
 */

import { Router } from 'express';
import sitemapController from '../controllers/sitemap.controller';

const router = Router();

// Mounted at the app root: GET /sitemap.xml
router.get('/sitemap.xml', sitemapController.getSitemap);

export default router;
