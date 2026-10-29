/**
 * @file registration.helper.ts
 * @description Indian registration-number utilities: validation regexes for
 *              traditional state series (e.g. MH12AB1234) and BH-series
 *              (e.g. 22BH1234AA), plus public masking.
 * @module Helpers
 * @author VehicleMarket Backend
 */

/** Traditional: MH12AB1234 / DL01C0123 / KA01AB1234 (state, RTO, optional series, 4 digits). */
export const REG_NUMBER_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/;

/** BH-series (Bharat Series): 22BH1234AA. */
export const BH_NUMBER_REGEX = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;

export const isValidRegNumber = (value: string): boolean => {
  const v = (value || '').toUpperCase().replace(/\s+/g, '');
  return REG_NUMBER_REGEX.test(v) || BH_NUMBER_REGEX.test(v);
};

/** Mask a registration number for public display: MH12AB1234 → MH12**1234. */
export const maskRegNumber = (reg?: string | null): string | undefined => {
  if (!reg) return undefined;
  const v = reg.toUpperCase().replace(/\s+/g, '');
  if (v.length < 8) return `${v.slice(0, 2)}**${v.slice(-2)}`;
  return `${v.slice(0, 4)}**${v.slice(-4)}`;
};

/** Mask a chassis/engine number: last 4 chars visible. */
export const maskLastFour = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  if (value.length <= 4) return '****';
  return `****${value.slice(-4)}`;
};

export default { isValidRegNumber, maskRegNumber, maskLastFour, REG_NUMBER_REGEX, BH_NUMBER_REGEX };
