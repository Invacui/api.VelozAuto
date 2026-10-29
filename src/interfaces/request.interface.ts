/**
 * @file request.interface.ts
 * @description Shared DAO/request types (pagination params, sort options).
 * @module Interfaces
 * @author VehicleMarket Backend
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  totalItems: number;
}

export default { };
