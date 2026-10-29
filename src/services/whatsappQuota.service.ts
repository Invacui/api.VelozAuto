/**
 * @file whatsappQuota.service.ts
 * @description Monthly WhatsApp message quota/stop-loss for Meta WhatsApp Cloud API.
 *              Tracks usage in Redis (or in-memory fallback) and blocks sending
 *              once the configured monthly limit is reached. Resets at start of
 *              each calendar month.
 * @module Services
 * @author VehicleMarket Backend
 */

import { redisClient } from '../config/redis';
import logger from '../logger/index';

const DEFAULT_MONTHLY_LIMIT = 900;

const getLimit = (): number => {
  const raw = process.env.WHATSAPP_MONTHLY_LIMIT || process.env.META_WHATSAPP_MONTHLY_LIMIT;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_MONTHLY_LIMIT;
  return parsed;
};

const getMonthKey = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `whatsapp:monthly:count:${year}-${month}`;
};

const getResetKey = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `whatsapp:monthly:reset:${year}-${month}`;
};

const getSecondsUntilEndOfMonth = (date: Date = new Date()): number => {
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  const diffMs = endOfMonth.getTime() - date.getTime();
  if (diffMs <= 0) return 60 * 60 * 24;
  return Math.ceil(diffMs / 1000);
};

export const getCurrentMonthUsage = async (date: Date = new Date()): Promise<number> => {
  try {
    const key = getMonthKey(date);
    const raw = await redisClient.get(key);
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch (err: any) {
    logger.warn('Failed to read WhatsApp monthly usage from cache', {
      fileName: 'whatsappQuota.service.ts',
      methodName: 'getCurrentMonthUsage',
      error: err?.message,
    });
    return 0;
  }
};

export const checkAndIncrementQuota = async (date: Date = new Date()): Promise<{
  allowed: boolean;
  count: number;
  limit: number;
  remaining: number;
}> => {
  const limit = getLimit();
  const key = getMonthKey(date);
  const resetKey = getResetKey(date);
  const ttl = getSecondsUntilEndOfMonth(date);

  try {
    const resetMarker = await redisClient.get(resetKey);
    if (!resetMarker) {
      await redisClient.set(key, '0', ttl);
      await redisClient.set(resetKey, '1', ttl);
      logger.info('WhatsApp monthly quota reset for new month', {
        fileName: 'whatsappQuota.service.ts',
        methodName: 'checkAndIncrementQuota',
        monthKey: key,
        limit,
      });
    }

    const current = await getCurrentMonthUsage(date);
    if (current >= limit) {
      logger.warn('WhatsApp monthly quota exceeded - blocking send', {
        fileName: 'whatsappQuota.service.ts',
        methodName: 'checkAndIncrementQuota',
        count: current,
        limit,
      });
      return {
        allowed: false,
        count: current,
        limit,
        remaining: Math.max(0, limit - current),
      };
    }

    const next = current + 1;
    await redisClient.set(key, String(next), ttl);
    return {
      allowed: true,
      count: next,
      limit,
      remaining: Math.max(0, limit - next),
    };
  } catch (err: any) {
    logger.error('WhatsApp quota check failed - allowing send with caution', {
      fileName: 'whatsappQuota.service.ts',
      methodName: 'checkAndIncrementQuota',
      error: err?.message,
    });
    return {
      allowed: true,
      count: -1,
      limit,
      remaining: limit,
    };
  }
};

export const enforceWhatsAppStopLoss = async (date: Date = new Date()): Promise<boolean> => {
  const result = await checkAndIncrementQuota(date);
  return result.allowed;
};

export const getQuotaStatus = async (date: Date = new Date()): Promise<{
  count: number;
  limit: number;
  remaining: number;
  allowed: boolean;
}> => {
  const limit = getLimit();
  const count = await getCurrentMonthUsage(date);
  return {
    count,
    limit,
    remaining: Math.max(0, limit - count),
    allowed: count < limit,
  };
};

export const resetMonthlyQuota = async (date: Date = new Date()): Promise<void> => {
  const key = getMonthKey(date);
  const resetKey = getResetKey(date);
  const ttl = getSecondsUntilEndOfMonth(date);
  await redisClient.set(key, '0', ttl);
  await redisClient.set(resetKey, '1', ttl);
  logger.info('WhatsApp monthly quota manually reset', {
    fileName: 'whatsappQuota.service.ts',
    methodName: 'resetMonthlyQuota',
    monthKey: key,
    limit: getLimit(),
  });
};

export default {
  getCurrentMonthUsage,
  checkAndIncrementQuota,
  enforceWhatsAppStopLoss,
  getQuotaStatus,
  resetMonthlyQuota,
};
