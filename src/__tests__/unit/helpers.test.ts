/**
 * @file helpers.test.ts
 * @description Unit tests for shared helpers (registration, Indian formats,
 *              roles, password, tokens).
 */
import {
  REG_NUMBER_REGEX,
  BH_NUMBER_REGEX,
  isValidRegNumber,
  maskRegNumber,
  maskLastFour,
} from '../../shared/helpers/registration.helper';
import {
  isValidIndianPhone,
  normalizeIndianPhone,
  isValidPincode,
  formatINR,
} from '../../shared/helpers/indian.helper';
import { isStaff } from '../../shared/helpers/roles.helper';
import { hashPassword, comparePassword } from '../../shared/helpers/password.helper';

describe('registration.helper', () => {
  it('accepts standard Indian registration numbers', () => {
    expect(isValidRegNumber('DL01AB1234')).toBe(true);
    expect(isValidRegNumber('KA03EF9012')).toBe(true);
    expect(isValidRegNumber('MH12CD5678')).toBe(true);
  });
  it('accepts BH-series numbers', () => {
    expect(BH_NUMBER_REGEX.test('22BH1234AB')).toBe(true);
    expect(isValidRegNumber('22BH1234AB')).toBe(true);
  });
  it('rejects malformed numbers', () => {
    expect(isValidRegNumber('12345')).toBe(false);
    expect(isValidRegNumber('DL01AB12')).toBe(false);
    expect(REG_NUMBER_REGEX.test('dl01ab1234')).toBe(false); // must be uppercase
  });
  it('masks a registration number for public output', () => {
    const masked = maskRegNumber('DL01AB1234');
    expect(masked).toContain('**');
    expect(masked).not.toBe('DL01AB1234');
  });
  it('returns undefined for empty input when masking', () => {
    expect(maskRegNumber('')).toBeUndefined();
    expect(maskRegNumber(null)).toBeUndefined();
  });
  it('masks all but the last four characters', () => {
    expect(maskLastFour('1234567890')).toBe('****7890');
  });
});

describe('indian.helper', () => {
  it('validates Indian mobile numbers starting 6-9', () => {
    expect(isValidIndianPhone('9876543210')).toBe(true);
    expect(isValidIndianPhone('6000000000')).toBe(true);
    expect(isValidIndianPhone('1234567890')).toBe(false);
    expect(isValidIndianPhone('98765432')).toBe(false);
  });
  it('normalizes phone numbers (strips +91 / spaces)', () => {
    expect(normalizeIndianPhone('+91 98765 43210')).toBe('9876543210');
    expect(normalizeIndianPhone('098765-43210')).toBe('9876543210');
  });
  it('validates 6-digit PIN codes starting 1-8', () => {
    expect(isValidPincode('560001')).toBe(true);
    expect(isValidPincode('110001')).toBe(true);
    expect(isValidPincode('999999')).toBe(false);
    expect(isValidPincode('01234')).toBe(false);
  });
  it('formats INR with the Indian lakh/crore grouping', () => {
    expect(formatINR(123456)).toBe('1,23,456');
    expect(formatINR(10000000)).toBe('1,00,00,000');
  });
});

describe('roles.helper', () => {
  it('treats EMPLOYEE and ADMIN as staff', () => {
    expect(isStaff('EMPLOYEE')).toBe(true);
    expect(isStaff('ADMIN')).toBe(true);
    expect(isStaff('USER')).toBe(false);
    expect(isStaff(undefined)).toBe(false);
  });
});

describe('password.helper', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('Secret@123');
    expect(hash).not.toBe('Secret@123');
    expect(await comparePassword('Secret@123', hash)).toBe(true);
    expect(await comparePassword('wrong', hash)).toBe(false);
  });
});
