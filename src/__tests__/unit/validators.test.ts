/**
 * @file validators.test.ts
 * @description Unit tests for Joi validators — reject-unknown behaviour and
 *              domain rules for auth, vehicles, buy/sell requests.
 */
import {
  registerSchema,
  resetPasswordSchema,
  googleSchema,
  sendPhoneOtpSchema,
  verifyPhoneOtpSchema,
} from '../../validators/auth.validator';
import { createBuyRequestSchema, updateBuyRequestSchema } from '../../validators/buyRequest.validator';
import {
  createVehicleSchema,
  updateVehicleStatusSchema,
  listVehiclesQuerySchema,
} from '../../validators/vehicle.validator';
import { createSellRequestSchema } from '../../validators/sellRequest.validator';
import { idParamSchema } from '../../validators/common.validator';

const OID = '507f1f77bcf86cd799439011';

describe('auth.validator', () => {
  it('accepts a valid registration', () => {
    const { error } = registerSchema.validate({ name: 'Asha', email: 'a@x.com', password: 'Secret12' });
    expect(error).toBeUndefined();
  });
  it('requires a password with a letter and a number', () => {
    expect(registerSchema.validate({ name: 'Asha', email: 'a@x.com', password: 'password' }).error).toBeDefined();
    expect(registerSchema.validate({ name: 'Asha', email: 'a@x.com', password: '12345678' }).error).toBeDefined();
  });
  it('rejects unknown fields', () => {
    const { error } = registerSchema.validate({ name: 'Asha', email: 'a@x.com', password: 'Secret12', isAdmin: true });
    expect(error).toBeDefined();
  });
  it('reset-password requires token, email and password', () => {
    expect(resetPasswordSchema.validate({ token: 't', password: 'Secret12' }).error).toBeDefined();
    expect(resetPasswordSchema.validate({ token: 't', email: 'a@x.com', password: 'Secret12' }).error).toBeUndefined();
  });
  it('google sign-in requires a credential', () => {
    expect(googleSchema.validate({}).error).toBeDefined();
    expect(googleSchema.validate({ credential: 'x'.repeat(40) }).error).toBeUndefined();
  });
  it('validates phone OTP payloads', () => {
    expect(sendPhoneOtpSchema.validate({}).error).toBeUndefined();
    expect(sendPhoneOtpSchema.validate({ phone: '12345' }).error).toBeDefined();
    expect(verifyPhoneOtpSchema.validate({ code: '123456' }).error).toBeUndefined();
    expect(verifyPhoneOtpSchema.validate({ code: '12345' }).error).toBeDefined();
  });
});

describe('common.validator', () => {
  it('accepts a 24-char ObjectId and rejects others', () => {
    expect(idParamSchema.validate({ id: OID }).error).toBeUndefined();
    expect(idParamSchema.validate({ id: 'nope' }).error).toBeDefined();
  });
});

describe('vehicle.validator', () => {
  const valid = {
    category: 'PASSENGER_CAR', usageType: 'PRIVATE', brand: OID, model: 'Swift', manufacturingYear: 2019,
    fuelType: 'PETROL', transmission: 'MANUAL', ownerCount: '1ST', price: 500000, kmDriven: 40000,
    registrationState: 'Delhi', locationState: 'Delhi', locationCity: 'Delhi', locationPincode: '110001',
    roadTax: 'LIFETIME', accidentHistory: 'NONE', tyreCondition: 'GOOD',
  };
  it('accepts a valid vehicle payload', () => {
    expect(createVehicleSchema.validate(valid).error).toBeUndefined();
  });
  it('rejects an invalid enum value', () => {
    expect(createVehicleSchema.validate({ ...valid, category: 'SPACESHIP' }).error).toBeDefined();
  });
  it('rejects an invalid PIN code', () => {
    expect(createVehicleSchema.validate({ ...valid, locationPincode: '999999' }).error).toBeDefined();
  });
  it('requires a valid ObjectId for brand', () => {
    expect(createVehicleSchema.validate({ ...valid, brand: 'not-an-id' }).error).toBeDefined();
  });
  it('validates status transitions enum', () => {
    expect(updateVehicleStatusSchema.validate({ status: 'SOLD' }).error).toBeUndefined();
    expect(updateVehicleStatusSchema.validate({ status: 'DELETED' }).error).toBeDefined();
  });
  it('accepts filter query with sort and pagination', () => {
    expect(listVehiclesQuerySchema.validate({ category: 'COMMERCIAL', page: 2, limit: 10 }).error).toBeUndefined();
  });
});

describe('buyRequest.validator', () => {
  const valid = { vehicle: OID, name: 'Rahul', phone: '9876543210' };
  it('accepts a valid buy request', () => {
    expect(createBuyRequestSchema.validate(valid).error).toBeUndefined();
  });
  it('rejects a non-Indian phone number', () => {
    expect(createBuyRequestSchema.validate({ ...valid, phone: '1234567890' }).error).toBeDefined();
  });
  it('requires at least one field on update', () => {
    expect(updateBuyRequestSchema.validate({}).error).toBeDefined();
    expect(updateBuyRequestSchema.validate({ status: 'CONTACTED' }).error).toBeUndefined();
  });
});

describe('sellRequest.validator', () => {
  const valid = {
    name: 'Priya', phone: '9876543210', city: 'Pune', pincode: '411001', expectedPrice: 500000,
    category: 'PASSENGER_CAR', brandName: 'Maruti Suzuki', model: 'Swift', manufacturingYear: 2019,
    usageType: 'PRIVATE', fuelType: 'PETROL', transmission: 'MANUAL', kmDriven: 40000, ownerCount: '1ST',
    registrationState: 'Maharashtra', insuranceType: 'COMPREHENSIVE', loanStatus: 'NO_LOAN',
    accidentHistory: 'NONE', tyreCondition: 'GOOD',
  };
  it('accepts a complete sell request', () => {
    expect(createSellRequestSchema.validate(valid).error).toBeUndefined();
  });
  it('rejects an invalid PIN code', () => {
    expect(createSellRequestSchema.validate({ ...valid, pincode: '012345' }).error).toBeDefined();
  });
  it('rejects an unknown field', () => {
    expect(createSellRequestSchema.validate({ ...valid, hacker: 'x' }).error).toBeDefined();
  });
});
