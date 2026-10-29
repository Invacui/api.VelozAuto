/**
 * @file asyncHandler.ts
 * @description Express route handler wrapper that catches rejected promises
 *              and forwards them to the error middleware.
 * @module Utils
 * @author VehicleMarket Backend
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
