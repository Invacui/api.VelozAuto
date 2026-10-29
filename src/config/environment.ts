/**
 * @file environment.ts
 * @description Environment configuration loader using dotenv. Provides typed
 *              access to all environment variables with sensible defaults.
 * @module Config
 * @author VehicleMarket Backend
 */

import dotenv from 'dotenv';
import path from 'path';

class EnvironmentConfig {
  private static instance: EnvironmentConfig;

  private constructor() {
    this.loadEnvironment();
  }

  public static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  private loadEnvironment(): void {
    const nodeEnv = process.env.NODE_ENV || 'development';

    // Production hosts supply env vars via the dashboard — skip file loading.
    if (process.env.RENDER || nodeEnv === 'production') {
      return;
    }

    const envFile = this.getEnvironmentFile(nodeEnv);
    const result = dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });
    if (result.error) {
      console.warn(`Warning: Could not load ${envFile}: ${result.error.message}`);
    }
  }

  private getEnvironmentFile(nodeEnv: string): string {
    const envFiles: Record<string, string> = {
      development: 'environment/development.env',
      production: 'environment/production.env',
      staging: 'environment/staging.env',
      test: 'environment/development.env',
    };
    return envFiles[nodeEnv] || envFiles.development;
  }

  public getServerConfig() {
    return {
      port: parseInt(process.env.PORT || '4000', 10),
      baseUrl: process.env.BASE_URL || 'http://localhost',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  public getCORSConfig() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
    ];

    return {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    };
  }

  public getJWTConfig() {
    return {
      accessSecret: process.env.JWT_ACCESS_SECRET || 'vm-dev-access-secret',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'vm-dev-refresh-secret',
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    };
  }

  public getResendConfig() {
    return {
      apiKey: process.env.RESEND_API_KEY || '',
      defaultSenderEmail: process.env.RESEND_DEFAULT_SENDER || 'VehicleMarket <noreply@vehiclemarket.example>',
    };
  }

  public getZavuConfig() {
    return {
      apiKey: process.env.ZAVUDEV_API_KEY || process.env.WHATSAPP_TOKEN || process.env.META_WHATSAPP_TOKEN || process.env.CLOUD_API_ACCESS_TOKEN || '',
      senderId: process.env.ZAVUDEV_SENDER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID || '',
      requestAckTemplateId: process.env.ZAVUDEV_TEMPLATE_REQUEST_ACK || process.env.WHATSAPP_TEMPLATE_REQUEST_ACK || process.env.META_WHATSAPP_TEMPLATE_ACK || '',
      phoneOtpTemplateId: process.env.ZAVUDEV_TEMPLATE_PHONE_OTP || process.env.WHATSAPP_OTP_TEMPLATE_NAME || process.env.META_WHATSAPP_OTP_TEMPLATE || process.env.OTP_TEMPLATE_NAME || process.env.WHATSAPP_TEMPLATE_NAME || 'otp',
    };
  }

  public getWhatsAppConfig() {
    return this.getZavuConfig();
  }

  public getMetaWhatsAppConfig() {
    return {
      accessToken: process.env.WHATSAPP_TOKEN || process.env.META_WHATSAPP_TOKEN || process.env.CLOUD_API_ACCESS_TOKEN || process.env.ZAVUDEV_API_KEY || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID || process.env.ZAVUDEV_SENDER_ID || '',
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || process.env.META_WABA_ID || '',
      version: process.env.WHATSAPP_API_VERSION || process.env.META_GRAPH_API_VERSION || 'v21.0',
      otpTemplateName: process.env.WHATSAPP_OTP_TEMPLATE_NAME || process.env.META_WHATSAPP_OTP_TEMPLATE || process.env.OTP_TEMPLATE_NAME || process.env.WHATSAPP_TEMPLATE_NAME || process.env.ZAVUDEV_TEMPLATE_PHONE_OTP || 'otp',
      otpTemplateLanguage: process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE || process.env.META_WHATSAPP_TEMPLATE_LANG || 'en_US',
      requestAckTemplateName: process.env.WHATSAPP_TEMPLATE_REQUEST_ACK || process.env.META_WHATSAPP_TEMPLATE_ACK || process.env.ZAVUDEV_TEMPLATE_REQUEST_ACK || '',
    };
  }

  public getGoogleConfig() {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
    };
  }

  public getLoggingConfig() {
    return {
      level: process.env.LOG_LEVEL || 'debug',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_FILE_MAX_FILES || '14d',
    };
  }

  public getStorageConfig() {
    return {
      mode: (process.env.STORAGE_MODE || 'local') as 's3' | 'local',
      s3: {
        endpoint: process.env.S3_ENDPOINT || '',
        region: process.env.S3_REGION || 'ap-south-1',
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        bucket: process.env.S3_BUCKET || 'vehicle-marketplace',
        publicUrl: process.env.S3_PUBLIC_URL || '',
      },
      local: {
        uploadPath: process.env.LOCAL_UPLOAD_PATH || './uploads',
      },
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
      maxImagesPerVehicle: parseInt(process.env.MAX_IMAGES_PER_VEHICLE || '15', 10),
    };
  }

  public getAdminConfig() {
    return {
      adminEmail: process.env.ADMIN_EMAIL || '',
    };
  }

  public isDevelopment(): boolean {
    return (process.env.NODE_ENV || 'development') === 'development';
  }

  public isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  public isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  }
}

export const envConfig = EnvironmentConfig.getInstance();
export default envConfig;
