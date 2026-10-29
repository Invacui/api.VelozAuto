/**
 * @file auth.routes.ts
 * @description Authentication routes mounted at /api/v1/auth.
 * @module Routes
 * @author VehicleMarket Backend
 */

import { Router } from 'express';
import validate from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { strictLimiter, otpLimiter } from '../middleware/rateLimiter.middleware';
import { upload } from '../middleware/upload.middleware';
import * as authController from '../controllers/auth.controller';
import {
  registerSchema,
  loginSchema,
  googleSchema,
  sendPhoneOtpSchema,
  verifyPhoneOtpSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailParamsSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', strictLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', strictLimiter, validate({ body: loginSchema }), authController.login);
router.post('/google', strictLimiter, validate({ body: googleSchema }), authController.googleLogin);
router.post('/phone/send-otp', authenticate, otpLimiter, validate({ body: sendPhoneOtpSchema }), authController.sendPhoneOtp);
router.post('/phone/verify-otp', authenticate, otpLimiter, validate({ body: verifyPhoneOtpSchema }), authController.verifyPhoneOtp);
router.post('/refresh', validate({ body: refreshTokenSchema }), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', strictLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', strictLimiter, validate({ body: resetPasswordSchema }), authController.resetPassword);
router.get('/verify-email/:token', validate({ params: verifyEmailParamsSchema }), authController.verifyEmail);
router.post('/resend-verification', authenticate, authController.resendVerification);

router.get('/me', authenticate, authController.me);
router.patch('/me', authenticate, validate({ body: updateProfileSchema }), authController.updateMe);
router.patch('/me/password', authenticate, validate({ body: changePasswordSchema }), authController.changePassword);
router.post('/me/profile-image', authenticate, upload('photo'), authController.uploadProfileImage);

export default router;
