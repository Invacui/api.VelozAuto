/**
 * @file whatsapp.service.ts
 * @description WhatsApp delivery through Meta WhatsApp Cloud API (official). Uses approved message templates
 *              when configured and logs to the console when no credentials are set.
 * @module Services
 * @author VehicleMarket Backend
 */

import https from 'https';
import envConfig from '../config/environment';
import logger from '../logger/index';
import { enforceWhatsAppStopLoss } from './whatsappQuota.service';

interface SendWhatsAppOptions {
  to: string;
  text: string;
  templateId?: string;
  templateName?: string;
  templateLanguageCode?: string;
  templateVariables?: Record<string, string>;
  idempotencyKey?: string;
  metadata?: Record<string, string>;
}

export const toE164 = (phone: string): string => {
  const value = String(phone || '').trim();
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (value.startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
};

const normalizeTemplateValue = (value: string): string =>
  String(value || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();

const getMetaConfig = () => {
  if (typeof (envConfig as any).getMetaWhatsAppConfig === 'function') {
    return (envConfig as any).getMetaWhatsAppConfig();
  }
  const zavu = envConfig.getZavuConfig();
  return {
    accessToken: zavu.apiKey,
    phoneNumberId: zavu.senderId,
    version: 'v21.0',
    otpTemplateName: zavu.phoneOtpTemplateId || 'otp',
    otpTemplateLanguage: 'en_US',
    requestAckTemplateName: zavu.requestAckTemplateId || '',
  };
};

export const isWhatsAppConfigured = (): boolean => {
  const cfg = getMetaConfig();
  return Boolean(cfg.accessToken && cfg.phoneNumberId);
};

export const isWhatsAppOtpConfigured = (): boolean => {
  const cfg = getMetaConfig();
  return Boolean(cfg.accessToken && cfg.phoneNumberId && cfg.otpTemplateName);
};

const sendViaMetaCloudApi = async (
  to: string,
  options: {
    templateName?: string;
    templateLanguageCode?: string;
    templateVariables?: Record<string, string>;
    text?: string;
  }
): Promise<boolean> => {
  const cfg = getMetaConfig();
  const recipient = toE164(to);

  if (!recipient) {
    logger.warn('WhatsApp message skipped: invalid recipient phone', {
      fileName: 'whatsapp.service.ts',
      methodName: 'sendWhatsApp',
    });
    return false;
  }

  // Enforce monthly stop-loss cap (set to 900) before sending via API
  const allowedByQuota = await enforceWhatsAppStopLoss();
  if (!allowedByQuota) {
    logger.warn('WhatsApp message blocked by monthly quota stop-loss', {
      fileName: 'whatsapp.service.ts',
      methodName: 'sendWhatsApp',
      recipientMasked: recipient.replace(/(\+\d{2})\d+(\d{4})/, '$1****$2'),
    });
    return false;
  }

  if (!cfg.accessToken || !cfg.phoneNumberId) {
    const templateName = options.templateName || cfg.otpTemplateName;
    logger.info(`[whatsapp:stub] ${templateName ? `template ${templateName}` : 'text'} -> ${recipient}`, {
      fileName: 'whatsapp.service.ts',
      methodName: 'sendWhatsApp',
      text: options.text,
      templateId: templateName,
      templateVariables: options.templateVariables,
    });
    return false;
  }

  const phoneNumberId = cfg.phoneNumberId;
  const accessToken = cfg.accessToken;
  const version = cfg.version || 'v21.0';

  const payload: any = {
    messaging_product: 'whatsapp',
    to: recipient.replace('+', ''),
  };

  if (options.templateName) {
    const components: any[] = [];
    const vars = options.templateVariables || {};
    const values = Object.values(vars).map((v) => normalizeTemplateValue(String(v)));
    if (values.length > 0) {
      components.push({
        type: 'body',
        parameters: values.map((text) => ({ type: 'text', text })),
      });
    }
    payload.type = 'template';
    payload.template = {
      name: options.templateName,
      language: {
        code: options.templateLanguageCode || cfg.otpTemplateLanguage || 'en_US',
      },
      ...(components.length > 0 ? { components } : {}),
    };
  } else if (options.text) {
    payload.type = 'text';
    payload.text = { body: options.text };
  } else {
    logger.warn('WhatsApp message skipped: no content provided', {
      fileName: 'whatsapp.service.ts',
      methodName: 'sendWhatsApp',
    });
    return false;
  }

  const data = JSON.stringify(payload);

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'graph.facebook.com',
        path: `/${version}/${phoneNumberId}/messages`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            logger.info(`WhatsApp message sent -> ${recipient}`, {
              fileName: 'whatsapp.service.ts',
              methodName: 'sendWhatsApp',
              templateId: options.templateName,
            });
            resolve(true);
          } else {
            logger.error('Failed to send WhatsApp message', {
              fileName: 'whatsapp.service.ts',
              methodName: 'sendWhatsApp',
              error: responseBody || `HTTP ${res.statusCode}`,
              templateId: options.templateName,
            });
            resolve(false);
          }
        });
      }
    );

    req.on('error', (err: any) => {
      logger.error('Failed to send WhatsApp message', {
        fileName: 'whatsapp.service.ts',
        methodName: 'sendWhatsApp',
        error: err?.message || String(err),
        templateId: options.templateName,
      });
      resolve(false);
    });

    req.write(data);
    req.end();
  });
};

const sendWhatsApp = async ({
  to,
  text,
  templateId,
  templateName,
  templateLanguageCode,
  templateVariables,
  idempotencyKey,
  metadata,
}: SendWhatsAppOptions): Promise<boolean> => {
  const cfg = getMetaConfig();
  const template = templateName || templateId || cfg.otpTemplateName || cfg.requestAckTemplateName;

  return sendViaMetaCloudApi(to, {
    templateName: template || undefined,
    templateLanguageCode,
    templateVariables,
    text,
  });
};

export const sendWhatsAppOtp = async ({
  to,
  code,
  name,
}: {
  to: string;
  code: string;
  name?: string;
}): Promise<boolean> => {
  const cfg = getMetaConfig();
  const templateName = cfg.otpTemplateName || process.env.WHATSAPP_OTP_TEMPLATE_NAME || process.env.META_WHATSAPP_OTP_TEMPLATE || 'otp';
  const greeting = name ? `Hi ${name}, ` : '';

  return sendViaMetaCloudApi(to, {
    templateName,
    templateLanguageCode: cfg.otpTemplateLanguage || 'en_US',
    templateVariables: { '1': code },
    text: `${greeting}your Veloz Auto verification code is ${code}. It expires in 5 minutes.`,
  });
};

export const sendWhatsAppAcknowledgement = async ({
  to,
  name,
  message,
  reference,
}: {
  to: string;
  name: string;
  message: string;
  reference?: string;
}): Promise<void> => {
  const cfg = getMetaConfig();
  const templateName = cfg.requestAckTemplateName || undefined;

  await sendViaMetaCloudApi(to, {
    templateName,
    templateVariables: { '1': name, '2': message },
    text: `Hi ${name}, ${message}`,
  });
};

export default {
  isWhatsAppConfigured,
  isWhatsAppOtpConfigured,
  sendWhatsAppOtp,
  sendWhatsAppAcknowledgement,
  toE164,
};
