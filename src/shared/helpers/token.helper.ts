/**
 * @file token.helper.ts
 * @description JWT access/refresh token generation and verification helpers.
 * @module Helpers
 * @author VehicleMarket Backend
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import envConfig from '../../config/environment';
import { UserRole } from '../../types';

const jwtConfig = envConfig.getJWTConfig();

export interface AccessTokenPayload {
  id: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  id: string;
  jti: string;
}

export const signAccess = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn,
  } as jwt.SignOptions);
};

export const signRefresh = (payload: { id: string }): string => {
  const jti = crypto.randomUUID();
  return jwt.sign({ ...payload, jti }, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  } as jwt.SignOptions);
};

export const verifyRefresh = (token: string): { id: string; jti: string } => {
  return jwt.verify(token, jwtConfig.refreshSecret) as RefreshTokenPayload;
};

export default { signAccess, signRefresh, verifyRefresh };
