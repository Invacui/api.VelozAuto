/**
 * @file sitemap.controller.ts
 * @description Sitemap HTTP handler.
 * @module Controllers
 * @author VehicleMarket Backend
 */

import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { buildSitemap } from '../services/sitemap.service';

export const getSitemap = asyncHandler(async (_req, res: Response) => {
  const xml = await buildSitemap();
  res.header('Content-Type', 'application/xml');
  res.status(200).send(xml);
});

export default { getSitemap };
