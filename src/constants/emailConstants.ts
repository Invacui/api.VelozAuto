/**
 * @file emailConstants.ts
 * @description Email template names and default sender for the pluggable
 *              email service.
 * @module Constants
 * @author VehicleMarket Backend
 */

export const RESEND_SENDER_EMAIL = 'VehicleMarket <noreply@vehiclemarket.example>';

export const TEMPLATE_NAME = {
  WELCOME: 'WELCOME',
  PASSWORD_RESET: 'PASSWORD_RESET',
  BUY_REQUEST_RECEIVED: 'BUY_REQUEST_RECEIVED',
  BUY_REQUEST_ADMIN: 'BUY_REQUEST_ADMIN',
  SELL_REQUEST_RECEIVED: 'SELL_REQUEST_RECEIVED',
  SELL_OFFER_MADE: 'SELL_OFFER_MADE',
  SELL_LISTED: 'SELL_LISTED',
  CONTACT_ACK: 'CONTACT_ACK',
} as const;

export type TemplateName = (typeof TEMPLATE_NAME)[keyof typeof TEMPLATE_NAME];
