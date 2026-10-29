/**
 * @file auth.middleware.ts
 * @description JWT authentication middleware. Verifies Bearer tokens from the
 *              Authorization header or HTTP-only cookies, checks the cache
 *              blacklist for logged-out tokens, and attaches `req.user`.
 * @module Middleware
 * @author VehicleMarket Backend
 */

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { redisClient } from '../config/redis';
import { errorResponse } from '../utils/apiResponse';
import logger from '../logger/index';
import { ACCESS_TOKEN_COOKIE } from '../shared/helpers/cookie.helper';
import { UserRole } from '../types';

interface TokenPayload extends JwtPayload {
  id: string;
  role: UserRole;
  email?: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token && req.cookies && req.cookies[ACCESS_TOKEN_COOKIE]) {
      token = req.cookies[ACCESS_TOKEN_COOKIE];
    }

    if (!token) {
      errorResponse(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    const secret = process.env.JWT_ACCESS_SECRET || '';
    if (!secret) {
      logger.error('JWT secret is not configured', {
        fileName: 'auth.middleware.ts',
        methodName: 'authenticate',
      });
      errorResponse(res, 'Internal server error', 500, 'CONFIG_ERROR');
      return;
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;

    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      errorResponse(res, 'Token has been invalidated. Please log in again.', 401, 'TOKEN_BLACKLISTED');
      return;
    }

    req.user = {
      id: decoded.id || (decoded.sub as string) || '',
      role: decoded.role || 'USER',
      email: decoded.email,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      errorResponse(res, 'Token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
      return;
    }
    if (err.name === 'JsonWebTokenError') {
      errorResponse(res, 'Invalid token.', 401, 'INVALID_TOKEN');
      return;
    }
    logger.error('Authentication middleware error', {
      fileName: 'auth.middleware.ts',
      methodName: 'authenticate',
      error: err.message,
    });
    errorResponse(res, 'Authentication failed', 401, 'UNAUTHORIZED');
  }
};

/**
 * Optional authentication — attaches `req.user` when a valid token is present
 * but never blocks the request. Used by public endpoints that behave
 * differently for signed-in users (e.g. buy/sell request intake).
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token && req.cookies && req.cookies[ACCESS_TOKEN_COOKIE]) {
      token = req.cookies[ACCESS_TOKEN_COOKIE];
    }
    if (!token) {
      next();
      return;
    }
    const secret = process.env.JWT_ACCESS_SECRET || '';
    if (!secret) {
      next();
      return;
    }
    const decoded = jwt.verify(token, secret) as TokenPayload;
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (!isBlacklisted) {
      req.user = {
        id: decoded.id || (decoded.sub as string) || '',
        role: decoded.role || 'USER',
        email: decoded.email,
      };
    }
  } catch {
    /* ignore — treat as anonymous */
  }
  next();
};

export default authenticate;
