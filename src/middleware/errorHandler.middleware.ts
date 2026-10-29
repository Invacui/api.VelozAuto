/**
 * @file errorHandler.middleware.ts
 * @description Global Express error handler. Maps thrown errors to the
 *              standard error envelope and proper HTTP status codes.
 * @module Middleware
 * @author VehicleMarket Backend
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { errorResponse } from '../utils/apiResponse';
import logger from '../logger/index';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  void _next;
  logger.error(err.message || 'Unhandled error', {
    fileName: 'errorHandler.middleware.ts',
    methodName: 'errorHandler',
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  // ---- AppError ----
  if (err instanceof AppError) {
    errorResponse(
      res,
      err.message,
      err.statusCode,
      err.message.replace(/\s+/g, '_').toUpperCase()
    );
    return;
  }

  // ---- Mongoose ValidationError ----
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e: any) => e.message);
    errorResponse(res, 'Validation failed', 400, 'VALIDATION_ERROR', messages);
    return;
  }

  // ---- Mongoose CastError (invalid ObjectId etc.) ----
  if (err instanceof mongoose.Error.CastError) {
    errorResponse(res, `Invalid value for ${err.path}: ${err.value}`, 400, 'CAST_ERROR');
    return;
  }

  // ---- MongoDB duplicate key ----
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value for ${field}. This ${field} is already in use.`;
    errorResponse(res, message, 409, 'DUPLICATE_KEY');
    return;
  }

  // ---- JWT errors ----
  if (err instanceof TokenExpiredError) {
    errorResponse(res, 'Token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
    return;
  }
  if (err instanceof JsonWebTokenError) {
    errorResponse(res, 'Invalid token.', 401, 'INVALID_TOKEN');
    return;
  }

  // ---- Unknown ----
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  errorResponse(
    res,
    message,
    statusCode,
    'INTERNAL_ERROR',
    process.env.NODE_ENV === 'development' ? [err.stack] : undefined
  );
};

export default errorHandler;
