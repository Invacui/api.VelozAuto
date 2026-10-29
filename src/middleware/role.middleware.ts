/**
 * @file role.middleware.ts
 * @description Role-based access control middleware.
 * @module Middleware
 * @author VehicleMarket Backend
 */

import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/apiResponse';
import { UserRole } from '../types';

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      errorResponse(res, 'Insufficient permissions to access this resource', 403, 'FORBIDDEN');
      return;
    }

    next();
  };
};

export default requireRole;
