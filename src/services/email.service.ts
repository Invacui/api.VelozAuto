/**
 * @file email.service.ts
 * @description Pluggable email service. Uses Resend when RESEND_API_KEY is
 *              configured; otherwise logs to the console so the app runs
 *              without an email provider in development.
 * @module Services
 * @author VehicleMarket Backend
 */

import envConfig from '../config/environment';
import { TEMPLATE_NAME, TemplateName } from '../constants/emailConstants';
import logger from '../logger/index';

interface RenderedEmail {
  subject: string;
  html: string;
}

const renderTemplate = (template: TemplateName, vars: Record<string, any>): RenderedEmail => {
  switch (template) {
    case TEMPLATE_NAME.WELCOME:
      return {
        subject: 'Welcome to VehicleMarket',
        html: `<p>Hi ${vars.username || 'there'},</p><p>Welcome to VehicleMarket — India's marketplace for buying and selling used vehicles. Start exploring or list your own vehicle today.</p>${
          vars.verifyLink
            ? `<p>Please verify your email address:</p><p><a href="${vars.verifyLink}">${vars.verifyLink}</a></p>`
            : ''
        }`,
      };
    case TEMPLATE_NAME.PASSWORD_RESET:
      return {
        subject: 'Reset your VehicleMarket password',
        html: `<p>Hi ${vars.username || 'there'},</p><p>Use the link below to reset your password (valid for 1 hour):</p><p><a href="${vars.resetLink}">${vars.resetLink}</a></p>`,
      };
    case TEMPLATE_NAME.BUY_REQUEST_RECEIVED:
      return {
        subject: `We received your enquiry for ${vars.vehicleName}`,
        html: `<p>Hi ${vars.username || 'there'},</p><p>Thanks for your interest in <b>${vars.vehicleName}</b>. Our team will contact you shortly on ${vars.phone}.</p>`,
      };
    case TEMPLATE_NAME.BUY_REQUEST_ADMIN:
      return {
        subject: `New buy request: ${vars.vehicleName}`,
        html: `<p>${vars.name} (${vars.phone}) is interested in <b>${vars.vehicleName}</b>.</p><p>${vars.message || ''}</p>`,
      };
    case TEMPLATE_NAME.SELL_REQUEST_RECEIVED:
      return {
        subject: `We received your sell request (${vars.requestId})`,
        html: `<p>Hi ${vars.username || 'there'},</p><p>We received your request to sell your <b>${vars.vehicleName}</b>. Our team will review it and contact you to schedule an inspection.</p>`,
      };
    case TEMPLATE_NAME.SELL_OFFER_MADE:
      return {
        subject: `We have an offer for your ${vars.vehicleName}`,
        html: `<p>Hi ${vars.username || 'there'},</p><p>After inspection we can offer <b>₹${vars.offerPrice}</b> for your ${vars.vehicleName}. Contact us to proceed.</p>`,
      };
    case TEMPLATE_NAME.SELL_LISTED:
      return {
        subject: `Your vehicle is now listed`,
        html: `<p>Hi ${vars.username || 'there'},</p><p>Your ${vars.vehicleName} is now live on VehicleMarket.</p>`,
      };
    case TEMPLATE_NAME.CONTACT_ACK:
      return {
        subject: 'We received your message',
        html: `<p>Hi ${vars.name || 'there'},</p><p>Thanks for contacting VehicleMarket. Our team will get back to you soon.</p>`,
      };
    default:
      return { subject: 'VehicleMarket', html: '<p>VehicleMarket notification</p>' };
  }
};

/**
 * Send an email. Never throws — failures are logged so callers can fire-and-forget.
 */
export const sendEmail = async (
  to: string,
  template: TemplateName,
  vars: Record<string, any> = {}
): Promise<void> => {
  const { subject, html } = renderTemplate(template, vars);
  const { apiKey, defaultSenderEmail } = envConfig.getResendConfig();

  if (!apiKey) {
    logger.info(`[email:stub] "${subject}" → ${to}`, {
      fileName: 'email.service.ts',
      methodName: 'sendEmail',
      template,
    });
    return;
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    await resend.emails.send({ from: defaultSenderEmail, to, subject, html });
    logger.info(`Email sent: ${template} → ${to}`, {
      fileName: 'email.service.ts',
      methodName: 'sendEmail',
    });
  } catch (err: any) {
    logger.error('Failed to send email', {
      fileName: 'email.service.ts',
      methodName: 'sendEmail',
      error: err.message,
      to,
    });
  }
};

export default { sendEmail };
