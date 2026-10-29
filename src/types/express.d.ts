/**
 * @file express.d.ts
 * @description Express namespace augmentation for `req.user`.
 * @module Types
 * @author VehicleMarket Backend
 */

import { UserRole } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        email?: string;
      };
    }
  }
}

export {};
