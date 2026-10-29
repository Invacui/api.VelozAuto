/**
 * @file cookie.helper.ts
 * @description HTTP-only auth cookie helpers. The access token is NEVER placed
 *              in a cookie — it goes in the Authorization: Bearer header. The
 *              long-lived refresh token lives in an httpOnly cookie so CSRF has
 *              nothing to ride on for authenticated actions.
 * @module Helpers
 * @author VehicleMarket Backend
 */

import { Response } from 'express';

export const REFRESH_TOKEN_COOKIE = 'vm_refresh';
export const ACCESS_TOKEN_COOKIE = 'access_token'; // legacy/read-back only

const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? ('strict' as const) : ('lax' as const),
  path: '/',
  maxAge: REFRESH_MAX_AGE,
});

export const setAuthCookies = (res: Response, _accessToken: string, refreshToken: string): void => {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, getRefreshCookieOptions());
};

export const clearAuthCookies = (res: Response): void => {
  res.cookie(REFRESH_TOKEN_COOKIE, '', { ...getRefreshCookieOptions(), maxAge: 0 });
};

export default { setAuthCookies, clearAuthCookies, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE };
