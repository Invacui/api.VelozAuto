/**
 * @file indian.helper.ts
 * @description Indian format validators + formatters shared by Joi schemas and
 *              mongoose model validators (phone, pincode, price).
 * @module Helpers
 * @author VehicleMarket Backend
 */

/** 10-digit Indian mobile starting 6-9 (optionally with +91/91/0 prefix — normalized upstream). */
export const INDIAN_PHONE_REGEX = /^[6-9][0-9]{9}$/;

/** Accepts +91, 91, 0 or bare 10-digit and normalizes to bare 10 digits. */
export const normalizeIndianPhone = (value: string): string => {
  let v = (value || '').replace(/[\s-]/g, '');
  if (v.startsWith('+91')) v = v.slice(3);
  else if (v.startsWith('91') && v.length === 12) v = v.slice(2);
  else if (v.startsWith('0') && v.length === 11) v = v.slice(1);
  return v;
};

export const isValidIndianPhone = (value: string): boolean =>
  INDIAN_PHONE_REGEX.test(normalizeIndianPhone(value));

/** Indian PIN code: 6 digits, first digit 1-8. */
export const INDIAN_PINCODE_REGEX = /^[1-8][0-9]{5}$/;

export const isValidPincode = (value: string): boolean => INDIAN_PINCODE_REGEX.test(String(value || ''));

/** Format INR with lakh/crore grouping: 1234567 → "12,34,567". */
export const formatINR = (amount: number): string => {
  const num = Math.round(Number(amount) || 0);
  if (num < 0) return `-${formatINR(-num)}`;
  const s = String(num);
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
};

export default { isValidIndianPhone, normalizeIndianPhone, isValidPincode, formatINR };
