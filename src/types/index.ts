/**
 * @file index.ts
 * @description Shared types used across the VehicleMarket backend.
 * @module Types
 * @author VehicleMarket Backend
 */

import { Request } from 'express';

/** Application roles. EMPLOYEE handles chat/requests; ADMIN has full access. */
export type UserRole = 'USER' | 'EMPLOYEE' | 'ADMIN';

/** Authenticated Express request with user info attached by auth middleware. */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    email?: string;
  };
}

/** Standard pagination query params. */
export interface PaginationQuery {
  page?: string;
  limit?: string;
}

/** Sort direction. */
export type SortDirection = 'asc' | 'desc';
