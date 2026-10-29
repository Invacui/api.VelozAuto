/**
 * @file wishlist.validator.ts
 * @description Joi params validation for wishlist endpoints.
 * @module Validators
 * @author VehicleMarket Backend
 */

import Joi from 'joi';
import { objectId } from './common.validator';

export const vehicleIdParamSchema = Joi.object({
  vehicleId: objectId.required(),
});

export default { vehicleIdParamSchema };
