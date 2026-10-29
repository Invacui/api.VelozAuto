/**
 * @file app.ts
 * @description Express application factory — middleware stack, static uploads,
 *              health check, Swagger UI, API routes, 404 and error handling.
 * @module App
 * @author VehicleMarket Backend
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import envConfig from './config/environment';
import { rateLimiter } from './middleware/rateLimiter.middleware';
import mongoSanitize from './middleware/mongoSanitize.middleware';
import errorHandler from './middleware/errorHandler.middleware';
import routes from './routes';
import sitemapRoutes from './routes/sitemap.routes';
import { successResponse, errorResponse } from './utils/apiResponse';
import logger from './logger/index';

const app: Application = express();

// ---- Security & parsing ----
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(envConfig.getCORSConfig()));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize);

// ---- Static uploads (local storage mode) ----
const uploadPath = envConfig.getStorageConfig().local.uploadPath;
app.use('/uploads', express.static(path.resolve(uploadPath)));

// ---- Rate limiting ----
app.use('/api', rateLimiter);

// ---- Health ----
app.get('/health', (_req: Request, res: Response) => {
  successResponse(res, { status: 'ok', uptime: process.uptime() }, 'Service healthy');
});

// ---- Swagger ----
try {
  const specPath = path.resolve(__dirname, '../docs/openapi.json');
  if (fs.existsSync(specPath)) {
    const openapiDocument = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
    app.get('/api-docs.json', (_req: Request, res: Response) => res.json(openapiDocument));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
  } else {
    logger.warn('openapi.json not found — Swagger UI disabled', {
      fileName: 'app.ts',
      methodName: 'bootstrap',
      specPath,
    });
  }
} catch (err: any) {
  logger.error('Failed to load OpenAPI spec', { fileName: 'app.ts', methodName: 'bootstrap', error: err.message });
}

// ---- Sitemap (root-level) ----
app.use('/', sitemapRoutes);

// ---- API v1 ----
app.use('/api/v1', routes);

// ---- 404 ----
app.use((_req: Request, res: Response) => {
  errorResponse(res, 'Route not found', 404, 'NOT_FOUND');
});

// ---- Error handler ----
app.use(errorHandler);

export default app;
