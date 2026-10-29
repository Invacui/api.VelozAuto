/**
 * @file rateLimiter.middleware.ts
 * @description Rate limiting middleware using `express-rate-limit`.
 * @module Middleware
 * @author VehicleMarket Backend
 */

import rateLimit from 'express-rate-limit';
import { Request } from 'express';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10);

export const rateLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => process.env.NODE_ENV === 'test' || req.path.startsWith('/socket.io'),
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
});

/** Tight limiter for auth + public uploads. */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
});

/** Dedicated limiter for phone verification code requests. */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many verification code requests. Please try again later.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
});

export default rateLimiter;
