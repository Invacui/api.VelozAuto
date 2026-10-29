/**
 * @file apiResponse.ts
 * @description Standardised API response formatters (success/error envelope
 *              with optional pagination metadata).
 * @module Utils
 * @author VehicleMarket Backend
 */

import { Response } from 'express';

/** Pagination metadata attached to paginated list responses. */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Shape of a standard success response body. */
export interface SuccessResponseBody<T = any> {
  success: true;
  message: string;
  data?: T;
  pagination?: PaginationMeta;
}

/** Shape of a standard error response body. */
export interface ErrorResponseBody {
  success: false;
  message: string;
  error: string;
  errors?: string[];
  stack?: string;
}

/** Send a success response with optional data and pagination metadata. */
export const successResponse = <T = any>(
  res: Response,
  data?: T,
  message: string = 'Request completed successfully',
  statusCode: number = 200,
  pagination?: PaginationMeta
): void => {
  const body: SuccessResponseBody<T> = { success: true, message };
  if (data !== undefined) body.data = data;
  if (pagination) body.pagination = pagination;
  res.status(statusCode).json(body);
};

/** Send a success response for resource creation (HTTP 201). */
export const createdResponse = <T = any>(
  res: Response,
  data?: T,
  message: string = 'Resource created successfully'
): void => {
  successResponse(res, data, message, 201);
};

/** Send an error response. */
export const errorResponse = (
  res: Response,
  message: string = 'Internal server error',
  statusCode: number = 500,
  error: string = 'INTERNAL_ERROR',
  errors?: string[]
): void => {
  const body: ErrorResponseBody = { success: false, message, error };
  if (errors && errors.length > 0) body.errors = errors;
  res.status(statusCode).json(body);
};

/** Build pagination meta from page/limit/total. */
export const buildPagination = (page: number, limit: number, totalItems: number): PaginationMeta => {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export default { successResponse, createdResponse, errorResponse, buildPagination };
