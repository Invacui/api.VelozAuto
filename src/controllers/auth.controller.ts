/**
 * @file auth.controller.ts
 * @description Authentication HTTP handlers.
 * @module Controllers
 * @author VehicleMarket Backend
 */

import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, createdResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { AuthenticatedRequest } from '../types';
import { setAuthCookies, clearAuthCookies, REFRESH_TOKEN_COOKIE } from '../shared/helpers/cookie.helper';
import * as authService from '../services/auth.service';

export const register = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password, phone } = req.body;
  const result = await authService.register(name, email, password, phone);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  createdResponse(
    res,
    { user: result.user, accessToken: result.accessToken, accessTokenExpiresAt: result.accessTokenExpiresAt },
    'Account created successfully'
  );
});

export const login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, phone, password } = req.body;
  const result = await authService.login({ email, phone }, password);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  successResponse(
    res,
    { user: result.user, accessToken: result.accessToken, accessTokenExpiresAt: result.accessTokenExpiresAt },
    'Logged in successfully'
  );
});

export const googleLogin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await authService.googleLogin(req.body.credential);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  successResponse(
    res,
    { user: result.user, accessToken: result.accessToken, accessTokenExpiresAt: result.accessTokenExpiresAt },
    'Signed in with Google'
  );
});

export const sendPhoneOtp = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await authService.sendPhoneOtp(req.user!.id, req.body.phone);
  const message = result.alreadyVerified ? 'Phone number already verified' : 'Verification code sent';
  successResponse(res, result, message);
});

export const verifyPhoneOtp = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.verifyPhoneOtp(req.user!.id, req.body.code);
  successResponse(res, user, 'Phone number verified');
});

export const refresh = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const token = req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body.refreshToken;
  if (!token) throw new AppError('Refresh token is required.', 401);
  const result = await authService.refresh(token);
  setAuthCookies(res, result.accessToken, result.refreshToken);
  successResponse(res, { accessToken: result.accessToken }, 'Token refreshed');
});

export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const accessToken = (req.headers.authorization || '').replace('Bearer ', '');
  await authService.logout(accessToken, req.user?.id || '');
  clearAuthCookies(res);
  successResponse(res, {}, 'Logged out successfully');
});

export const forgotPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await authService.forgotPassword(req.body.email);
  successResponse(res, {}, 'If that email is registered, a reset link has been sent.');
});

export const resetPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, token, password } = req.body;
  await authService.resetPassword(email, token, password);
  successResponse(res, {}, 'Password reset successfully');
});

export const verifyEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.verifyEmail(req.params.token);
  successResponse(res, user, 'Email verified successfully');
});

export const resendVerification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await authService.resendVerification(req.user!.id);
  successResponse(res, {}, 'Verification email sent');
});

export const me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.getProfile(req.user!.id);
  successResponse(res, user, 'Profile fetched');
});

export const updateMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.updateProfile(req.user!.id, req.body);
  successResponse(res, user, 'Profile updated');
});

export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.id, currentPassword, newPassword);
  successResponse(res, {}, 'Password changed successfully');
});

export const uploadProfileImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.uploadProfileImage(req.user!.id, req.file as Express.Multer.File);
  successResponse(res, user, 'Profile image updated');
});

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
  me,
  updateMe,
  changePassword,
  uploadProfileImage,
};
