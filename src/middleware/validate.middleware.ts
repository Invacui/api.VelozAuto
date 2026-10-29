/**
 * @file validate.middleware.ts
 * @description Request validation middleware using Joi schemas. Rejects
 *              unknown keys and writes the coerced/normalised values back onto
 *              the request so controllers receive clean, typed inputs.
 * @module Middleware
 * @author VehicleMarket Backend
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { errorResponse } from '../utils/apiResponse';

export interface ValidationSchemas {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validationErrors: string[] = [];

    if (schemas.body) {
      const { value, error } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: false,
        allowUnknown: false,
        convert: true,
      });
      if (error) validationErrors.push(...error.details.map((d) => d.message));
      else req.body = value;
    }

    if (schemas.params) {
      const { value, error } = schemas.params.validate(req.params, {
        abortEarly: false,
        convert: true,
      });
      if (error) validationErrors.push(...error.details.map((d) => d.message));
      else req.params = value as any;
    }

    if (schemas.query) {
      const { value, error } = schemas.query.validate(req.query, {
        abortEarly: false,
        convert: true,
      });
      if (error) validationErrors.push(...error.details.map((d) => d.message));
      else req.query = value as any;
    }

    if (validationErrors.length > 0) {
      errorResponse(res, 'Validation failed', 400, 'VALIDATION_ERROR', validationErrors);
      return;
    }

    next();
  };
};

export default validate;
