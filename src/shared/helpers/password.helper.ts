/**
 * @file password.helper.ts
 * @description bcrypt password hashing and verification helpers.
 * @module Helpers
 * @author VehicleMarket Backend
 */

import bcrypt from 'bcryptjs';

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, ROUNDS);
};

export const comparePassword = async (candidate: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(candidate, hash);
};

export default { hashPassword, comparePassword };
