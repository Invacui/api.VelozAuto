/**
 * @file auth.service.ts
 * @description Authentication service — registration, login, JWT issuance,
 *              refresh, password reset and profile management.
 * @module Services
 * @author VehicleMarket Backend
 */

import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import * as userDao from '../dao/user.dao';
import { AppError } from '../utils/AppError';
import { signAccess, signRefresh, verifyRefresh } from '../shared/helpers/token.helper';
import { comparePassword } from '../shared/helpers/password.helper';
import * as cache from '../shared/lib/redis.lib';
import envConfig from '../config/environment';
import logger from '../logger/index';
import { sendEmail } from './email.service';
import { sendWhatsAppOtp, isWhatsAppOtpConfigured } from './whatsapp.service';
import { TEMPLATE_NAME } from '../constants/emailConstants';
import { storageService } from '../shared/lib/storage.lib';
import { STORAGE_PATHS, buildStoragePath, generateFileName } from '../constants/storagePaths';
import { isValidIndianPhone, normalizeIndianPhone } from '../shared/helpers/indian.helper';
import { UserRole } from '../types';

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    emailVerified: boolean;
    phoneVerified: boolean;
    phone?: string;
    profileImage?: string;
  };
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
}

const ACCESS_TTL_MS = 15 * 60 * 1000; // mirrors JWT_ACCESS_EXPIRES default
const accessTokenExpiresAt = (): string => new Date(Date.now() + ACCESS_TTL_MS).toISOString();

const OTP_TTL_SECONDS = 5 * 60;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LENGTH = 6;
const otpKey = (userId: string): string => `phone_otp:${userId}`;
const otpCooldownKey = (userId: string): string => `phone_otp_cooldown:${userId}`;

interface PhoneOtpRecord {
  phone: string;
  hash: string;
  attempts: number;
  expiresAt: number;
}

export interface SendPhoneOtpResult {
  phone: string;
  sent: boolean;
  alreadyVerified: boolean;
  devCode?: string;
}

const hashOtp = (userId: string, code: string): string =>
  crypto
    .createHmac('sha256', process.env.SESSION_SECRET || 'vm-dev-session-secret')
    .update(`${userId}:${code}`)
    .digest('hex');

const generateOtp = (): string =>
  String(crypto.randomInt(10 ** (OTP_LENGTH - 1), 10 ** OTP_LENGTH));

const normalizePhone = (phone: string): string => normalizeIndianPhone(String(phone || '').trim());

const toPublicUser = (user: any): AuthResult['user'] => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  emailVerified: !!user.emailVerified,
  phoneVerified: !!user.phoneVerified,
  phone: user.phone,
  profileImage: user.profileImage,
});

const issueAuthResult = async (user: any): Promise<AuthResult> => {
  const accessToken = signAccess({ id: String(user._id), role: user.role as UserRole });
  const refreshToken = signRefresh({ id: String(user._id) });
  const decoded = verifyRefresh(refreshToken);
  await cache.set(`refresh_session:${decoded.jti}`, String(user._id), 7 * 24 * 60 * 60);

  return {
    user: toPublicUser(user),
    accessToken,
    accessTokenExpiresAt: accessTokenExpiresAt(),
    refreshToken,
  };
};

// =====================
// Register
// =====================

export const register = async (
  name: string,
  email: string,
  password: string,
  phone?: string
): Promise<AuthResult> => {
  const methodName = 'register';
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhone = phone ? normalizePhone(phone) : undefined;

  const existing = await userDao.findByEmail(normalizedEmail);
  if (existing) {
    throw new AppError('A user with this email already exists.', 409);
  }
  if (normalizedPhone) {
    const existingPhone = await userDao.findByPhone(normalizedPhone);
    if (existingPhone) {
      throw new AppError('A user with this phone number already exists.', 409);
    }
  }

  const user = await userDao.create({
    name,
    email: normalizedEmail,
    phone: normalizedPhone,
    passwordHash: password, // hashed by the model pre-save hook
    role: 'USER',
  });

  const result = await issueAuthResult(user);

  await issueEmailVerification(user);

  logger.info(`${methodName} - exit`, { fileName: 'auth.service.ts', methodName, userId: user._id });
  return result;
};

// =====================
// Login
// =====================

export const login = async (
  credentials: { email?: string; phone?: string },
  password: string
): Promise<AuthResult> => {
  const normalizedPhone = credentials.phone ? normalizePhone(credentials.phone) : '';
  const user = normalizedPhone
    ? await userDao.findByPhoneWithPassword(normalizedPhone)
    : await userDao.findByEmailWithPassword(String(credentials.email || ''));

  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email, mobile number or password.', 401);
  }
  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403);
  }

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    throw new AppError('Invalid email, mobile number or password.', 401);
  }

  return issueAuthResult(user);
};

// =====================
// Google sign-in
// =====================

export const googleLogin = async (credential: string): Promise<AuthResult> => {
  const { clientId } = envConfig.getGoogleConfig();
  if (!clientId) {
    throw new AppError('Google sign-in is not configured.', 503);
  }

  let payload: any;
  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    payload = ticket.getPayload();
  } catch (err: any) {
    logger.warn('Google credential verification failed', {
      fileName: 'auth.service.ts',
      methodName: 'googleLogin',
      error: err?.message || String(err),
    });
    throw new AppError('Google sign-in failed. Please try again.', 401);
  }

  if (!payload?.email) {
    throw new AppError('Google account did not provide an email address.', 400);
  }
  if (payload.email_verified === false) {
    throw new AppError('Please verify your Google email address first.', 403);
  }

  const email = String(payload.email).toLowerCase().trim();
  let user = await userDao.findByEmail(email);

  if (user) {
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }
    const updates: Record<string, any> = {};
    if (!user.emailVerified) updates.emailVerified = true;
    if (!user.profileImage && payload.picture) updates.profileImage = payload.picture;
    if (Object.keys(updates).length > 0) {
      user = (await userDao.updateById(String(user._id), updates)) || user;
    }
  } else {
    user = await userDao.create({
      name: payload.name || email.split('@')[0],
      email,
      emailVerified: true,
      phoneVerified: false,
      role: 'USER',
      ...(payload.picture ? { profileImage: payload.picture } : {}),
    });
  }

  return issueAuthResult(user);
};

// =====================
// Phone verification
// =====================

export const sendPhoneOtp = async (
  userId: string,
  phoneInput?: string
): Promise<SendPhoneOtpResult> => {
  const user = await userDao.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  if (!user.isActive) throw new AppError('Your account has been deactivated.', 403);

  const requestedPhone = phoneInput ? normalizePhone(phoneInput) : normalizePhone(user.phone || '');
  if (!requestedPhone) {
    throw new AppError('Add a mobile number to verify.', 400);
  }
  if (!isValidIndianPhone(requestedPhone)) {
    throw new AppError('Enter a valid 10-digit Indian mobile number.', 400);
  }

  if (user.phoneVerified && requestedPhone === normalizePhone(user.phone || '')) {
    return { phone: requestedPhone, sent: false, alreadyVerified: true };
  }

  const existing = await userDao.findByPhone(requestedPhone);
  if (existing && String(existing._id) !== String(user._id)) {
    throw new AppError('This phone number is already in use.', 409);
  }

  if (requestedPhone !== user.phone) {
    await userDao.updateById(userId, { phone: requestedPhone, phoneVerified: false });
  }

  if (await cache.get(otpCooldownKey(userId))) {
    throw new AppError('Please wait before requesting another code.', 429);
  }

  if (envConfig.isProduction() && !isWhatsAppOtpConfigured()) {
    throw new AppError('WhatsApp verification is not configured.', 503);
  }

  const code = generateOtp();
  const expiresAt = Date.now() + OTP_TTL_SECONDS * 1000;
  const record: PhoneOtpRecord = {
    phone: requestedPhone,
    hash: hashOtp(userId, code),
    attempts: 0,
    expiresAt,
  };

  await cache.setJson(otpKey(userId), record, OTP_TTL_SECONDS);
  await cache.set(otpCooldownKey(userId), '1', OTP_RESEND_COOLDOWN_SECONDS);

  const delivered = await sendWhatsAppOtp({
    to: requestedPhone,
    code,
    name: user.name,
  });

  if (!delivered && envConfig.isProduction()) {
    await cache.del(otpCooldownKey(userId));
    await cache.del(otpKey(userId));
    throw new AppError('Could not send the verification code. Please try again.', 502);
  }

  return {
    phone: requestedPhone,
    sent: delivered,
    alreadyVerified: false,
    ...(!delivered && (envConfig.isDevelopment() || envConfig.isTest()) ? { devCode: code } : {}),
  };
};

export const verifyPhoneOtp = async (
  userId: string,
  code: string
): Promise<AuthResult['user']> => {
  const record = await cache.getJson<PhoneOtpRecord>(otpKey(userId));
  if (!record) {
    throw new AppError('The verification code is invalid or has expired.', 400);
  }
  if (Date.now() > record.expiresAt) {
    await cache.del(otpKey(userId));
    throw new AppError('The verification code is invalid or has expired.', 400);
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await cache.del(otpKey(userId));
    throw new AppError('Too many incorrect attempts. Request a new code.', 429);
  }

  const user = await userDao.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  if (record.phone !== normalizePhone(user.phone || '')) {
    await cache.del(otpKey(userId));
    throw new AppError('Your phone number changed. Request a new code.', 400);
  }

  if (record.hash !== hashOtp(userId, code)) {
    record.attempts += 1;
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await cache.del(otpKey(userId));
      throw new AppError('Too many incorrect attempts. Request a new code.', 429);
    }
    const remainingTtl = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000));
    await cache.setJson(otpKey(userId), record, remainingTtl);
    throw new AppError('Incorrect verification code.', 400);
  }

  const updated = await userDao.updateById(userId, {
    phone: record.phone,
    phoneVerified: true,
  });
  if (!updated) throw new AppError('User not found.', 404);

  await cache.del(otpKey(userId));
  await cache.del(otpCooldownKey(userId));
  return toPublicUser(updated);
};

// =====================
// Refresh
// =====================

export const refresh = async (token: string): Promise<{ accessToken: string; refreshToken: string }> => {
  let decoded: { id: string; jti: string };
  try {
    decoded = verifyRefresh(token);
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }

  const sessionUserId = await cache.get(`refresh_session:${decoded.jti}`);
  if (!sessionUserId) {
    throw new AppError('Refresh session expired. Please log in again.', 401);
  }

  const user = await userDao.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new AppError('User no longer active.', 401);
  }

  const accessToken = signAccess({ id: String(user._id), role: user.role as UserRole });
  // rotate refresh token
  const refreshToken = signRefresh({ id: String(user._id) });
  const newDecoded = verifyRefresh(refreshToken);
  await cache.del(`refresh_session:${decoded.jti}`);
  await cache.set(`refresh_session:${newDecoded.jti}`, String(user._id), 7 * 24 * 60 * 60);

  return { accessToken, refreshToken };
};

export const logout = async (accessToken: string, userId: string): Promise<void> => {
  // blacklist the access token for its remaining life
  if (accessToken) {
    await cache.set(`blacklist:${accessToken}`, '1', 15 * 60);
  }
  void userId;
};

// =====================
// Password reset
// =====================

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await userDao.findByEmail(email);
  // Always succeed silently so we don't leak which emails exist.
  if (!user) return;

  const token = crypto.randomBytes(32).toString('hex');
  await cache.set(`password_reset:${token}`, String(user._id), 60 * 60); // 1 hour

  const { frontendUrl } = envConfig.getServerConfig();
  const resetLink = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
  await sendEmail(user.email, TEMPLATE_NAME.PASSWORD_RESET, { username: user.name, resetLink }).catch(() => {});
};

export const resetPassword = async (
  email: string,
  token: string,
  password: string
): Promise<void> => {
  const userId = await cache.get(`password_reset:${token}`);
  if (!userId) {
    throw new AppError('This reset link is invalid or has expired.', 400);
  }
  const user = await userDao.findById(userId);
  if (!user || user.email !== email.toLowerCase().trim()) {
    throw new AppError('This reset link is invalid or has expired.', 400);
  }
  // passwordHash is hashed by the model pre-save hook only on .save(); use update with hash helper
  const { hashPassword } = await import('../shared/helpers/password.helper');
  await userDao.updateById(userId, { passwordHash: await hashPassword(password) });
  await cache.del(`password_reset:${token}`);
};

// =====================
// Email verification
// =====================

/** Issue a fresh 24h verification token and email the link. */
export const issueEmailVerification = async (user: { id?: string; _id?: any; email: string; name?: string }): Promise<void> => {
  const userId = String((user as any)._id ?? user.id);
  const token = crypto.randomBytes(32).toString('hex');
  await cache.set(`email_verify:${token}`, userId, 24 * 60 * 60);
  const { frontendUrl } = envConfig.getServerConfig();
  const verifyLink = `${frontendUrl}/verify-email?token=${token}`;
  await sendEmail(user.email, TEMPLATE_NAME.WELCOME, { username: user.name, verifyLink }).catch(() => {});
};

export const verifyEmail = async (token: string): Promise<AuthResult['user']> => {
  const userId = await cache.get(`email_verify:${token}`);
  if (!userId) {
    throw new AppError('This verification link is invalid or has expired.', 400);
  }
  const user = await userDao.updateById(userId, { emailVerified: true });
  if (!user) throw new AppError('User not found.', 404);
  await cache.del(`email_verify:${token}`);
  return toPublicUser(user);
};

export const resendVerification = async (userId: string): Promise<void> => {
  const user = await userDao.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  if (user.emailVerified) return;
  await issueEmailVerification(user);
};

// =====================
// Profile
// =====================

export const getProfile = async (userId: string) => {
  const user = await userDao.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  return toPublicUser(user);
};

export const updateProfile = async (
  userId: string,
  data: { name?: string; phone?: string; profileImage?: string }
) => {
  const updates: Record<string, any> = { ...data };

  if (data.phone) {
    const current = await userDao.findById(userId);
    if (!current) throw new AppError('User not found.', 404);

    const phone = normalizePhone(data.phone);
    if (!isValidIndianPhone(phone)) {
      throw new AppError('Enter a valid 10-digit Indian mobile number.', 400);
    }

    const existing = await userDao.findByPhone(phone);
    if (existing && String(existing._id) !== userId) {
      throw new AppError('This phone number is already in use.', 409);
    }

    updates.phone = phone;
    if (phone !== normalizePhone(current.phone || '')) {
      updates.phoneVerified = false;
    }
  }

  const updated = await userDao.updateById(userId, updates);
  return toPublicUser(updated);
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await userDao.findByEmailWithPassword((await userDao.findById(userId))?.email || '');
  if (!user || !user.passwordHash) throw new AppError('User not found.', 404);
  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) throw new AppError('Current password is incorrect.', 400);
  const { hashPassword } = await import('../shared/helpers/password.helper');
  await userDao.updateById(userId, { passwordHash: await hashPassword(newPassword) });
};

export const uploadProfileImage = async (userId: string, file: Express.Multer.File) => {
  if (!file) throw new AppError('No file uploaded.', 400);
  const key = buildStoragePath(STORAGE_PATHS.USERS.PROFILE, {
    userId,
    file: generateFileName(file.originalname),
  });
  const url = await storageService.upload(key, file.buffer, file.mimetype);
  const updated = await userDao.updateById(userId, { profileImage: url });
  return toPublicUser(updated);
};

export default {
  register,
  login,
  googleLogin,
  sendPhoneOtp,
  verifyPhoneOtp,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  getProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
};
