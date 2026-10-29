/**
 * @file mongoSanitize.middleware.ts
 * @description Strips `$`-prefixed and dotted keys from request payloads to
 *              prevent NoSQL injection attempts.
 * @module Middleware
 * @author VehicleMarket Backend
 */

import { Request, Response, NextFunction } from 'express';

type AnyRecord = Record<string, any>;

const sanitizeObject = (obj: AnyRecord): AnyRecord => {
  if (Array.isArray(obj)) {
    return obj.map((item) => (item && typeof item === 'object' ? sanitizeObject(item) : item));
  }
  if (obj && typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof Buffer)) {
    const out: AnyRecord = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$') || key.includes('.')) continue; // drop dangerous keys
      out[key] = value && typeof value === 'object' ? sanitizeObject(value) : value;
    }
    return out;
  }
  return obj;
};

export const mongoSanitize = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query && Object.keys(req.query).length) {
    req.query = sanitizeObject(req.query as AnyRecord);
  }
  if (req.params && Object.keys(req.params).length) {
    req.params = sanitizeObject(req.params as AnyRecord);
  }
  next();
};

export default mongoSanitize;
